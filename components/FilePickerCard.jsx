// components/FilePickerCard.jsx
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";
import { parsePickedFile } from "../modules/parsing/detect";
import { saveLastSession } from "../services/storage";
import { resetFile, setFileMeta, setParsed } from "../store/fileStore";

export default function FilePickerCard() {
  const c = getColors("light");
  const [localMeta, setLocalMeta] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const f = res.assets?.[0];
      if (!f) return;

      // Reset previous file state
      resetFile();

      const parsed = await parsePickedFile({
        uri: f.uri,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
      });

      setFileMeta(parsed.meta);
      setParsed({ headers: parsed.headers, rows: parsed.rows });
      setFileMeta(parsed.meta);
setParsed({ headers: parsed.headers, rows: parsed.rows });
// persist last session snapshot
saveLastSession({ fileMeta: parsed.meta, mapping: null });
      setLocalMeta(parsed.meta);
    } catch (e) {
      // Log kept out of console to avoid noisy logs; set user-visible error instead
      setErr(e?.message || "Failed to read file.");
    } finally {
      setBusy(false);
    }
  };

  const sizeLabel = (n) =>
    typeof n === "number" ? `${Math.max(1, Math.round(n / 1024))} KB` : "—";

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
      </Text>

      <TouchableOpacity
        onPress={busy ? undefined : pick}
        activeOpacity={0.85}
        style={{
          backgroundColor: busy ? c.brand.primarySoft : c.brand.primary,
          paddingVertical: 12,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: busy ? c.textMuted : c.brand.onPrimary,
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          {busy ? "Reading" : "Choose File"}
        </Text>
      </TouchableOpacity>

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
          <Text style={{ color: c.text, fontWeight: "600" }}>{localMeta.name}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            {localMeta.mime} · {sizeLabel(localMeta.size)}
          </Text>
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
