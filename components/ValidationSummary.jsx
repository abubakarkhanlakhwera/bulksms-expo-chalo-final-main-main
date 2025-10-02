// components/ValidationSummary.jsx
import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { getColors } from "../assets/colors";

export default function ValidationSummary({ validated = [], counts = { total: 0, valid: 0, invalid: 0 } }) {
  const c = getColors("light");

  const { totalParts, avgParts, encGsm, encUcs2 } = useMemo(() => {
    let parts = 0, gsm = 0, ucs2 = 0;
    for (const r of validated) {
      if (r.valid) {
        parts += r.parts || 0;
        if (r.encoding === "GSM-7") gsm++;
        if (r.encoding === "UCS-2") ucs2++;
      }
    }
    const avg = counts.valid ? (parts / counts.valid) : 0;
    return { totalParts: parts, avgParts: avg, encGsm: gsm, encUcs2: ucs2 };
  }, [validated, counts.valid]);

  const Card = ({ title, value, color }) => (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
        padding: 14,
        borderRadius: 12,
      }}
    >
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{title}</Text>
      <Text style={{ color: color || c.text, fontSize: 18, fontWeight: "800" }}>{value}</Text>
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card title="Total rows" value={counts.total} />
        <Card title="Valid" value={counts.valid} color={c.states.success} />
        <Card title="Invalid" value={counts.invalid} color={c.states.danger} />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card title="Est. SMS parts (valid only)" value={totalParts} />
        <Card title="Avg parts / recipient" value={avgParts.toFixed(2)} />
        <Card title="Encoding mix (valid)" value={`GSM-7: ${encGsm} · UCS-2: ${encUcs2}`} />
      </View>
    </View>
  );
}
