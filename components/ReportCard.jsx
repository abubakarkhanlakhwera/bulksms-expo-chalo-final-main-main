// components/ReportCard.jsx
import { Text, View } from "react-native";
import { getColors } from "../assets/colors";

const spanLayout = {
  2: { basis: "48%", min: 140 },
  3: { basis: "31%", min: 110 },
  4: { basis: "23%", min: 90 },
};

export default function ReportCard({ title, value, sub, span = 3 }) {
  const c = getColors("light");
  const layout = spanLayout[span] || spanLayout[3];
  return (
    <View
      style={{
        flex: 1,
        flexBasis: layout.basis,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
  borderColor: c.border || "rgba(15, 23, 42, 0.08)",
  backgroundColor: c.surface || "#FFFFFF",
        shadowColor: "#0b1220",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
        minWidth: layout.min,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>
        {title}
      </Text>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: "800", marginTop: 6 }}>
        {value}
      </Text>
      {!!sub && (
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
          {sub}
        </Text>
      )}
    </View>
  );
}
