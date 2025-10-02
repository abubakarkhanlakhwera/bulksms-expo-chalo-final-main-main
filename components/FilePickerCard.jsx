// components/FilePickerCard.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { getColors } from "../assets/colors";
import { parsePickedFile } from "../modules/parsing/detect";
import { saveLastSession } from "../services/storage";
import { resetFile, setFileMeta, setParsed } from "../store/fileStore";
import { buttonColors } from "../theme/buttonColors";
import { useTheme } from "../theme/ThemeContext";
import ThreeDButton from "./ThreeDButton";

export default function FilePickerCard() {
  const theme = useTheme?.();
  const mode = theme?.mode ?? "light";
  const c = theme?.colors ?? getColors("light");
  const btnColors = buttonColors(mode);
  const [localMeta, setLocalMeta] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const MIME_TYPES = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ];

  const normalizeHeaders = (headers = []) =>
    headers.map((h) => String(h ?? "").trim().toLowerCase());

  const headersMatch = (a = [], b = []) => {
    const normA = normalizeHeaders(a);
    const normB = normalizeHeaders(b);
    if (normA.length !== normB.length) return false;
    for (let i = 0; i < normA.length; i += 1) {
      if (normA[i] !== normB[i]) return false;
    }
    return true;
  };

  const processFiles = async (files = [], { sourceLabel } = {}) => {
    if (!files.length) {
      throw new Error("No files selected.");
    }

    const sanitized = files.filter(Boolean);
    if (!sanitized.length) {
      throw new Error("No files selected.");
    }

    const googleSheet = sanitized.find((f) =>
      (f?.mimeType || "").includes("application/vnd.google-apps.spreadsheet")
    );
    if (googleSheet) {
      throw new Error("Google Sheets must be exported as CSV or XLSX before importing.");
    }

    setLocalMeta(null);
    resetFile();

    const metas = [];
    let combinedRows = [];
    let baseHeaders = null;

    for (const f of sanitized) {
      const parsed = await parsePickedFile({
        uri: f.uri,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
      });

      if (!baseHeaders) {
        baseHeaders = parsed.headers || [];
      } else if (!headersMatch(baseHeaders, parsed.headers || [])) {
        throw new Error(
          "Column mismatch between files. Please choose files that share identical headers."
        );
      }

      combinedRows = combinedRows.concat(Array.isArray(parsed.rows) ? parsed.rows : []);
      metas.push(parsed.meta);
    }

    const totalSize = metas.reduce(
      (sum, m) => sum + (typeof m?.size === "number" ? m.size : 0),
      0
    );

    const summaryMeta =
      metas.length === 1
        ? { ...metas[0] }
        : {
            name: `${metas.length} files selected${sourceLabel ? ` (${sourceLabel})` : ""}`,
            size: totalSize,
            mime: "multiple",
            files: metas,
          };

    if (sourceLabel && !summaryMeta.source) {
      summaryMeta.source = sourceLabel;
    }

    setFileMeta(summaryMeta);
    setParsed({ headers: baseHeaders || [], rows: combinedRows });
    saveLastSession({ fileMeta: summaryMeta, mapping: null });
    setLocalMeta(summaryMeta);
  };

  const pick = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: MIME_TYPES,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      await processFiles(res.assets || []);
    } catch (e) {
      setErr(e?.message || "Failed to read file.");
    } finally {
      setBusy(false);
    }
  };

  const pickFromDrive = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: MIME_TYPES,
        copyToCacheDirectory: true,
        presentationStyle: "fullScreen",
      });
      if (res.canceled) return;

      await processFiles(res.assets || [], { sourceLabel: "Google Drive" });
    } catch (e) {
      setErr(e?.message || "Failed to read file.");
    } finally {
      setBusy(false);
    }
  };

  const sizeLabel = (n) =>
    typeof n === "number" ? `${Math.max(1, Math.round(n / 1024))} KB` : "—";

  const chooseTextColor = busy ? c.textMuted : "#fff";
  const driveTextColor = busy ? c.textMuted : "#fff";
  const buttonContentStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  const summaryIsMulti =
    localMeta && (localMeta.mime === "multiple" || Array.isArray(localMeta.files));
  const summaryColor = summaryIsMulti ? (c.states?.success || "#16a34a") : c.text;
  const accentColor = c.states?.warning || "#f59e0b";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
        padding: 16,
        borderRadius: 12,
        gap: 12,
      }}
    >
      <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
        Import CSV/XLSX
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 13 }}>
        Required columns: <Text style={{ fontWeight: "600" }}>name</Text>,{" "}
        <Text style={{ fontWeight: "600" }}>phone</Text>,{" "}
        <Text style={{ fontWeight: "600" }}>message</Text>
        {Platform.OS === "android" && (
          <Text style={{ color: c.textMuted }}>
            {"\n"}Tip: Use the Google Drive button to browse cloud storage.
          </Text>
        )}
      </Text>

      <View
        style={{
          alignSelf: "stretch",
          flexDirection: Platform.OS === "web" ? "column" : "row",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <ThreeDButton
            onPress={busy ? undefined : pick}
            disabled={busy}
            color1={busy ? c.surfaceAlt : btnColors.import.color1}
            color2={busy ? c.border : btnColors.import.color2}
          >
            <View style={buttonContentStyle}>
              <MaterialCommunityIcons name="file-excel" size={20} color={chooseTextColor} />
              <Text style={{ color: chooseTextColor, fontWeight: "700" }}>
                {busy ? "Reading…" : "Choose Files"}
              </Text>
            </View>
          </ThreeDButton>
        </View>
        <View style={{ flex: 1 }}>
          <ThreeDButton
            onPress={busy ? undefined : pickFromDrive}
            disabled={busy}
            color1={busy ? c.surfaceAlt : (btnColors.drive?.color1 || "#0f9d58")}
            color2={busy ? c.border : (btnColors.drive?.color2 || "#0b8043")}
          >
            <View style={buttonContentStyle}>
              <MaterialCommunityIcons name="google-drive" size={20} color={driveTextColor} />
              <Text style={{ color: driveTextColor, fontWeight: "700" }}>
                {busy ? "Reading…" : "Google Drive"}
              </Text>
            </View>
          </ThreeDButton>
        </View>
      </View>

      {localMeta && (
        <View
          style={{
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surfaceAlt,
            padding: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: summaryColor, fontWeight: "600" }}>{localMeta.name}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {localMeta.mime} · {sizeLabel(localMeta.size)}
          </Text>
          {localMeta.source && (
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
              Source: {localMeta.source}
            </Text>
          )}
          {Array.isArray(localMeta.files) && localMeta.files.length > 0 && (
            <View style={{ marginTop: 8, gap: 4 }}>
              {localMeta.files.map((fileMeta, idx) => (
                <Text
                  key={`${fileMeta.name || idx}-${idx}`}
                  style={{ color: idx === 0 ? c.textMuted : accentColor, fontSize: 12 }}
                >
                  • {fileMeta.name} ({sizeLabel(fileMeta.size)})
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {!!err && (
        <Text style={{ color: c.states.danger, fontSize: 13, marginTop: 4 }}>
          {err}
        </Text>
      )}
    </View>
  );
}
