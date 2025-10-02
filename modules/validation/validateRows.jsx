// modules/validation/validateRows.jsx
import { estimateSmsParts } from "./message";
import { normalizePakistanMobile } from "./phone";

// ValidatedRow:
// { id, name, phoneRaw, phoneNormalized, message, parts, encoding, valid, reason? }

/* -------------------- helpers: numerals & fallback normalization -------------------- */

// Urdu/Arabic numerals → ASCII
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXT_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";
function toLatinDigits(s = "") {
  let out = "";
  for (const ch of String(s)) {
    const i1 = ARABIC_INDIC.indexOf(ch);
    if (i1 >= 0) { out += String(i1); continue; }
    const i2 = EXT_ARABIC_INDIC.indexOf(ch);
    if (i2 >= 0) { out += String(i2); continue; }
    out += ch;
  }
  return out;
}

function stripNonDigitsKeepPlus(s = "") {
  s = String(s).trim();
  if (s.startsWith("+")) return "+" + s.slice(1).replace(/[^\d]/g, "");
  return s.replace(/[^\d]/g, "");
}

// Local fallback if normalizePakistanMobile() returns !ok
function fallbackNormalizePk(raw = "") {
  const p = stripNonDigitsKeepPlus(toLatinDigits(raw));

  // +923XXXXXXXXX
  if (/^\+923\d{9}$/.test(p)) return { ok: true, normalized: p };

  // 00923XXXXXXXXX → +923XXXXXXXXX
  if (/^00923\d{9}$/.test(p)) return { ok: true, normalized: `+${p.slice(2)}` };

  // 923XXXXXXXXX → +923XXXXXXXXX
  if (/^923\d{9}$/.test(p)) return { ok: true, normalized: `+${p}` };

  // 03XXXXXXXXX → +923XXXXXXXXX
  if (/^03\d{9}$/.test(p)) return { ok: true, normalized: `+92${p.slice(1)}` };

  // 3XXXXXXXXX → +923XXXXXXXXX
  if (/^3\d{9}$/.test(p)) return { ok: true, normalized: `+92${p}` };

  return { ok: false, reason: "Not a Pakistan number (+92)" };
}

// Wrapper: try external helper first, then our fallback
function normalizePk(phoneRaw = "") {
  const cleaned = toLatinDigits(phoneRaw);
  const first = normalizePakistanMobile
    ? normalizePakistanMobile(cleaned)
    : { ok: false };
  return first?.ok ? first : fallbackNormalizePk(cleaned);
}

/* --------------------------------- main function ---------------------------------- */

export function validateRows({ rows = [], mapping = {} }) {
  const nameKey = mapping.name;
  const phoneKey = mapping.phone;
  const messageKey = mapping.message;

  const validated = [];
  let validCount = 0;
  let invalidCount = 0;

  rows.forEach((row, idx) => {
    const id = String(idx + 1); // stable per file order
    const name = (row?.[nameKey] ?? "").toString().trim();
    const phoneRaw = (row?.[phoneKey] ?? "").toString().trim();
    const message = (row?.[messageKey] ?? "").toString();

    // message present?
    const msgOk = message.trim().length > 0;

    // phone normalize (handles 03…, 3…, 92…, 0092…, +92… and Urdu digits)
    const phoneRes = phoneRaw ? normalizePk(phoneRaw) : { ok: false, reason: "Empty phone" };

    // encoding/parts (safe on empty too)
    const partsInfo = estimateSmsParts ? estimateSmsParts(message) : { parts: 0, encoding: "GSM-7" };

    // validity + reason
    const valid = msgOk && phoneRes.ok;
    let reason;
    if (!msgOk && !phoneRes.ok) reason = `Empty message; ${phoneRes.reason}`;
    else if (!msgOk) reason = "Empty message";
    else if (!phoneRes.ok) reason = phoneRes.reason;

    validated.push({
      id,
      name,
      phoneRaw,
      phoneNormalized: phoneRes.ok ? phoneRes.normalized : "",
      message,
      parts: partsInfo.parts,
      encoding: partsInfo.encoding,
      valid,
      reason,
    });

    valid ? validCount++ : invalidCount++;
  });

  return {
    rows: validated,
    counts: { total: validated.length, valid: validCount, invalid: invalidCount },
  };
}
