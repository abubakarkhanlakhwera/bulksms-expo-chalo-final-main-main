// modules/parsing/xlsx.js
import * as XLSX from "xlsx";

export function parseXlsxBase64(b64) {
  const workbook = XLSX.read(b64, { type: "base64" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }); // [{...}]
  const headers = rows.length ? Object.keys(rows[0]) : inferHeadersFromSheet(sheet);
  return { headers, rows };
}

function inferHeadersFromSheet(sheet) {
  // Fallback: try to read first row titles
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const headers = [];
  const r = range.s.r; // first row
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    headers.push(cell?.v != null ? String(cell.v) : `Column ${c + 1}`);
  }
  return headers;
}
