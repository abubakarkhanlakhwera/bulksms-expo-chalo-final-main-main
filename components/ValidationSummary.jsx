// components/ValidationSummary.jsx
import { useMemo } from "react";
import { Text, View } from "react-native";
import { getColors, hexToRgba } from "../assets/colors";

export default function ValidationSummary({
  validated = [],
  counts = { total: 0, valid: 0, invalid: 0 },
  palette = [],
}) {
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

  const fallbackPalette = [
    { base: "#2563eb" },
    { base: "#f97316" },
    { base: "#ec4899" },
    { base: "#22d3ee" },
    { base: "#c084fc" },
    { base: "#34d399" },
  ];

  const accents = (palette.length ? palette : fallbackPalette).map((entry) => {
    const base = entry.base;
    return {
      border: entry.border || base,
      background:
        entry.background || hexToRgba(base, entry.alphaBackground ?? 0.14),
      value: entry.value || base,
      label: entry.label || c.textMuted,
    };
  });

  const Card = ({ title, value, index }) => {
    const accent = accents[index % accents.length];
    return (
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: accent.border,
          backgroundColor: accent.background,
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: accent.label, fontSize: 12 }}>{title}</Text>
        <Text
          style={{ color: accent.value, fontSize: 18, fontWeight: "800" }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card title="Total rows" value={counts.total} index={0} />
        <Card title="Valid" value={counts.valid} index={1} />
        <Card title="Invalid" value={counts.invalid} index={2} />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card title="Est. SMS parts (valid only)" value={totalParts} index={3} />
        <Card title="Avg parts / recipient" value={avgParts.toFixed(2)} index={4} />
        <Card
          title="Encoding mix (valid)"
          value={`GSM-7: ${encGsm} · UCS-2: ${encUcs2}`}
          index={5}
        />
      </View>
    </View>
  );
}
