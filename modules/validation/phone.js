// modules/validation/phone.jsx
// Pakistan number normalization & validation.
//
// Accepted inputs:
//  - 03XXXXXXXXX (e.g., 03001234567)
//  - 3XXXXXXXXX  (e.g., 3001234567)
//  - +923XXXXXXXXX / 00923XXXXXXXXX / 923XXXXXXXXX
//  - With spaces, dashes, parentheses -> ignored
//
// Output normalized: +923XXXXXXXXX (E.164-like for PK mobiles)

const ONLY_DIGITS = /[0-9]/g;

export function stripToDigitsPlus(input = "") {
  const trimmed = String(input).trim();
  let out = "";
  for (const ch of trimmed) {
    if (ch === "+" && out.length === 0) out += ch;
    else if (ONLY_DIGITS.test(ch)) out += ch;
  }
  return out;
}

export function normalizePakistanMobile(raw) {
  if (!raw && raw !== 0) return { ok: false, normalized: "", reason: "Empty phone" };

  const s = stripToDigitsPlus(String(raw));
  if (!s) return { ok: false, normalized: "", reason: "Empty phone" };

  // 00 prefix -> +
  let t = s.startsWith("00") ? `+${s.slice(2)}` : s;

  // bare 92... -> +92...
  if (!t.startsWith("+") && t.startsWith("92")) t = `+${t}`;

  // 03XXXXXXXXX -> +923XXXXXXXXX
  if (t.startsWith("03") && t.length >= 11) {
    const rest = t.slice(1); // drop leading 0
    t = `+92${rest}`;
  }

  // 3XXXXXXXXX -> +923XXXXXXXXX
  if (t[0] !== "+" && t.length === 10 && t.startsWith("3")) {
    t = `+92${t}`;
  }

  // At this point: expected +92XXXXXXXXXX with 12 digits after '+'
  if (!t.startsWith("+92")) {
    return { ok: false, normalized: "", reason: "Not a Pakistan number (+92)" };
  }

  // Keep only + and digits
  t = stripToDigitsPlus(t);

  // Validate length: +92 + 10 digits = 13 chars total incl '+'
  const digits = t.replace("+", "");
  if (digits.length !== 12) {
    return { ok: false, normalized: "", reason: "Invalid length for +92 number" };
  }

  // Validate mobile pattern: 3XXXXXXXXX after country code
  const national = digits.slice(2); // remove 92
  if (!/^3\d{9}$/.test(national)) {
    return { ok: false, normalized: "", reason: "Invalid PK mobile format (needs 3XXXXXXXXX)" };
  }

  return { ok: true, normalized: `+${digits}` };
}
