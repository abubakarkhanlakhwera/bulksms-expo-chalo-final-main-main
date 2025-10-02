// components/FilePickerCard.jsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { getColors, hexToRgba } from "../assets/colors";
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

  const accentPalette = [
    c.states?.info || "#2563eb",
    "#f97316",
    "#a855f7",
    "#ec4899",
    "#22d3ee",
    "#facc15",
    "#fb7185",
    "#38bdf8",
    "#c084fc",
    "#f87171",
  ];
  const detailPalette = accentPalette.slice(1);

  const summaryColor = summaryIsMulti ? accentPalette[0] : c.text;
  const summaryBg = summaryIsMulti
    ? hexToRgba(accentPalette[0], mode === "dark" ? 0.22 : 0.12)
    : c.surfaceAlt;
  const summaryBorder = summaryIsMulti ? accentPalette[0] : c.border;

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
            borderColor: summaryBorder,
            backgroundColor: summaryBg,
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
              {localMeta.files.map((fileMeta, idx) => {
                const detailColor =
                  idx === 0
                    ? c.textMuted
                    : detailPalette[(idx - 1) % detailPalette.length];
                return (
                  <Text
                    key={`${fileMeta.name || idx}-${idx}`}
                    style={{ color: detailColor, fontSize: 12 }}
                  >
                    • {fileMeta.name} ({sizeLabel(fileMeta.size)})
                  </Text>
                );
              })}
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
