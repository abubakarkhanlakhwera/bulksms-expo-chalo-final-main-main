// modules/export/csv.jsx
// Build and persist CSV from rows; share/copy helpers.

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";

function csvEscape(value = "") {
  const s = String(value ?? "");
  const needs = /[",\n]/.test(s);
  const out = s.replace(/"/g, '""');
  return needs ? `"${out}"` : out;
}

export function buildFailedCsv({ validated = [] } = {}) {
  const cols = ["name", "phoneRaw", "phoneNormalized", "message", "reason"];
  const header = cols.join(",");
  const lines = [header];

  for (const r of validated) {
    if (r.valid) continue;
    const row = [
      csvEscape(r.name),
      csvEscape(r.phoneRaw),
      csvEscape(r.phoneNormalized),
      csvEscape(r.message),
      csvEscape(r.reason || ""),
    ].join(",");
    lines.push(row);
  }

  return lines.join("\n");
}

// Writes CSV to a temporary file and returns its URI
export async function saveCsvTemp(filename = "failed.csv", csvText = "") {
  const path = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(path, csvText, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}

export async function shareCsvFile(fileUri) {
  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, reason: "Sharing not available on this device" };
  }
  await Sharing.shareAsync(fileUri, { dialogTitle: "Share CSV" });
  return { ok: true };
}

export async function copyCsvToClipboard(csvText = "") {
  await Clipboard.setStringAsync(csvText);
  return { ok: true };
}
