// components/EmptyState.jsx
import React from "react";
import { View, Text } from "react-native";
import { getColors } from "../assets/colors";

export default function EmptyState({ title = "Nothing here yet", hint = "" }) {
  const c = getColors("light");
  return (
    <View
      accessible accessibilityRole="summary"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 6,
      }}
    >
      <Text style={{ color: c.text, fontWeight: "800" }}>{title}</Text>
      {!!hint && <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 12 }}>{hint}</Text>}
    </View>
  );
}
