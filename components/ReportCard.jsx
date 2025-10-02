// components/ReportCard.jsx
import React from "react";
import { View, Text } from "react-native";
import { getColors } from "../assets/colors";

export default function ReportCard({ title, value, sub }) {
  const c = getColors("light");
  return (
    <View style={{
      flex: 1,
      borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, padding: 14, borderRadius: 12
    }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{title}</Text>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>{value}</Text>
      {!!sub && <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>{sub}</Text>}
    </View>
  );
}
