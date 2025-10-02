// modules/validation/message.jsx
// SMS parts estimation (GSM-7 vs UCS-2).
// Single-part limits: GSM-7=160, UCS-2=70
// Multipart: GSM-7=153, UCS-2=67
//
// Extended GSM chars count as 2 (escape + char).
// This is a practical approximation suitable for planning.

const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u0020!\"#¤%&'()*+,-./0123456789:;<=>?"+
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

const GSM7_EXTENDED_SET = new Set("^{}\\[~]|€".split(""));

function isGsm7Char(ch) {
  return GSM7_BASIC.includes(ch) || GSM7_EXTENDED_SET.has(ch);
}

export function isGsm7(text = "") {
  for (const ch of String(text)) {
    if (!isGsm7Char(ch)) return false;
  }
  return true;
}

export function gsm7LengthWithExt(text = "") {
  let count = 0;
  for (const ch of String(text)) {
    count += GSM7_EXTENDED_SET.has(ch) ? 2 : 1;
  }
  return count;
}

export function estimateSmsParts(message = "") {
  const msg = String(message ?? "");
  if (msg.trim().length === 0) return { parts: 0, encoding: "none", length: 0 };

  if (isGsm7(msg)) {
    const len = gsm7LengthWithExt(msg);
    if (len <= 160) return { parts: 1, encoding: "GSM-7", length: len };
    return { parts: Math.ceil(len / 153), encoding: "GSM-7", length: len };
  } else {
    const len = [...msg].length; // UCS-2 code unit count approx
    if (len <= 70) return { parts: 1, encoding: "UCS-2", length: len };
    return { parts: Math.ceil(len / 67), encoding: "UCS-2", length: len };
  }
}
