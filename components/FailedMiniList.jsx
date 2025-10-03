// components/FailedMiniList.jsx
import { Text, View } from "react-native";
import { getColors } from "../assets/colors";
import { toLocalPakistaniFormat } from "../utils/phone-display";

export default function FailedMiniList({ invalidRows = [] }) {
  const c = getColors("light");
  const sample = invalidRows.slice(0, 25);

  return (
    <View style={{
      borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, borderRadius: 12, overflow: "hidden"
    }}>
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontWeight: "800" }}>Failed Preview (first 25)</Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{invalidRows.length} total</Text>
      </View>
      <View style={{ maxHeight: 360 }}>
        {sample.map((item) => (
          <View key={item.id}>
            <View style={{ padding: 12 }}>
              <Text style={{ color: c.text, fontWeight: "700" }}>
                {item.name || "(no name)"} — {toLocalPakistaniFormat(item.phoneRaw || "(no phone)")}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={{ color: c.states.danger, fontSize: 12, marginTop: 4 }}>
                Reason: {item.reason || "—"}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: c.border }} />
          </View>
        ))}
      </View>
    </View>
  );
}
