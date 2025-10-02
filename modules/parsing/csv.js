// modules/parsing/csv.js
import Papa from "papaparse";

export function parseCsvString(csvText) {
  // Handle potential BOM
  const clean = csvText.replace(/^\uFEFF/, "");
  const result = Papa.parse(clean, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors?.length) {
    // parse errors present; caller may surface these to the user. Suppress console warnings here.
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  // Collect headers reliably from meta OR from first row keys
  const headers =
    result.meta?.fields && result.meta.fields.length
      ? result.meta.fields
      : rows.length
      ? Object.keys(rows[0])
      : [];

  return { headers, rows };
}
