// components/ExportBar.jsx
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";
import { buildFailedCsv, copyCsvToClipboard, saveCsvTemp, shareCsvFile } from "../modules/export/csv";

export default function ExportBar({ validated = [] }) {
  const c = getColors("light");
  const [msg, setMsg] = useState("");

  const handleCopy = async () => {
    try {
      const csv = buildFailedCsv({ validated });
      await copyCsvToClipboard(csv);
      setMsg("Copied failed rows CSV to clipboard.");
    } catch (e) {
      setMsg(e?.message || "Copy failed.");
    }
  };

  const handleShare = async () => {
    try {
      const csv = buildFailedCsv({ validated });
      const uri = await saveCsvTemp("failed_rows.csv", csv);
      const res = await shareCsvFile(uri);
      setMsg(res.ok ? "Shared CSV." : (res.reason || "Share failed."));
    } catch (e) {
      setMsg(e?.message || "Share failed.");
    }
  };

  const Btn = ({ title, onPress }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10,
        borderWidth: 1, borderColor: c.border, backgroundColor: c.surface
      }}
    >
      <Text style={{ color: c.text, fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Btn title="Copy failed as CSV" onPress={handleCopy} />
        <Btn title="Share failed.csv" onPress={handleShare} />
      </View>
      {!!msg && <Text style={{ color: c.textMuted, fontSize: 12 }}>{msg}</Text>}
    </View>
  );
}
