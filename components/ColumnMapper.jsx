// components/ColumnMapper.jsx
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";

const ROLES = [
  { key: "name", label: "Name column" },
  { key: "phone", label: "Phone column" },
  { key: "message", label: "Message column" },
];

function Chip({ selected, children, onPress }) {
  const c = getColors("light");
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? c.brand.primary : c.border,
        backgroundColor: selected ? c.brand.primarySoft : c.surface,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: selected ? c.brand.primary : c.text,
          fontSize: 12,
          fontWeight: selected ? "700" : "500",
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export default function ColumnMapper({ headers = [], mapping, onChange }) {
  const c = getColors("light");

  // (no-op) previously computed set of used headers removed — mapping uniqueness enforced on select

  const select = (roleKey, header) => {
    // Make sure the same header isn’t assigned to multiple roles
    const next = { ...mapping };
    // remove the header from any other role
    Object.keys(next).forEach((k) => {
      if (k !== roleKey && next[k] === header) next[k] = null;
    });
    next[roleKey] = header;
    onChange?.(next);
  };

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
        Map file columns
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 13 }}>
        Tap a header to assign it to each role. Each header can be used once.
      </Text>

      {ROLES.map((r) => {
        const current = mapping?.[r.key] || null;
        return (
          <View key={r.key} style={{ marginTop: 8 }}>
            <Text style={{ color: c.text, fontWeight: "600", marginBottom: 8 }}>
              {r.label}
              <Text style={{ color: c.textMuted, fontWeight: "400" }}>
                {" "}
                {current ? `→ ${current}` : "(not set)"}
              </Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip
                selected={current === null}
                onPress={() => select(r.key, null)}
              >
                None
              </Chip>
              {headers.map((h) => (
                <Chip
                  key={`${r.key}:${h}`}
                  selected={current === h}
                  onPress={() => select(r.key, h)}
                >
                  {h}
                </Chip>
              ))}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}
