// Normalize and dedupe numbers to E.164 format (e.g., +14155550123)
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeNumbers(
  raw: string[] | string,
  defaultCountry: CountryCode = 'US' // Adjust if most of your users are in another country
): string[] {
  const arr = Array.isArray(raw) ? raw : raw.split(/[\s,;]+/);
  const seen = new Set<string>();

  for (const candidate of arr) {
    const c = (candidate ?? '').trim();
    if (!c) continue;
    const p = parsePhoneNumberFromString(c, defaultCountry);
    if (p?.isValid()) {
      seen.add(p.format('E.164')); // ensures +<country><number>
    }
  }
  return [...seen];
}

export function chunk<T>(items: T[], size = 40): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
