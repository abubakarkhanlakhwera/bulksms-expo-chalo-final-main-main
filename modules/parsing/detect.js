// modules/parsing/detect.js
import * as FileSystem from "expo-file-system/legacy";
import { parseCsvString } from "./csv";
import { parseXlsxBase64 } from "./xlsx";

const CSV = [".csv", "text/csv", "application/vnd.ms-excel"];
const XLSX = [
  ".xlsx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function parsePickedFile({ uri, name, mimeType, size }) {
  const ext = (name?.split(".").pop() || "").toLowerCase();
  const meta = { name, size, mime: mimeType || guessMime(ext) };

  if (CSV.includes(`.${ext}`) || CSV.includes(meta.mime)) {
    const text = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = parseCsvString(text);
    return { meta, ...parsed };
  }

  if (XLSX.includes(`.${ext}`) || XLSX.includes(meta.mime)) {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const parsed = parseXlsxBase64(b64);
    return { meta, ...parsed };
  }

  throw new Error("Unsupported file type. Please choose a .csv or .xlsx file.");
}

function guessMime(ext) {
  if (ext === "csv") return "text/csv";
  if (ext === "xlsx")
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}
