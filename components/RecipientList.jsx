// components/RecipientList.jsx
import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";
import EmptyState from "./EmptyState";

export default function RecipientList({ validated = [], ListHeaderComponent, ListFooterComponent }) {
  const c = getColors("light");
  const [filter, setFilter] = useState("all"); // all | valid | invalid
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let rows = validated;
    if (filter === "valid") rows = rows.filter((r) => r.valid);
    if (filter === "invalid") rows = rows.filter((r) => !r.valid);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter((r) =>
        (r.name || "").toLowerCase().includes(needle) ||
        (r.phoneNormalized || r.phoneRaw || "").toLowerCase().includes(needle) ||
        (r.reason || "").toLowerCase().includes(needle)
      );
    }
    return rows;
  }, [validated, filter, q]);

  const Seg = ({ v, label }) => {
    const active = filter === v;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Filter ${label}`}
        onPress={() => setFilter(v)}
        activeOpacity={0.85}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? c.brand.primary : c.border,
          backgroundColor: active ? c.brand.primarySoft : c.surface,
          marginRight: 8,
        }}
      >
        <Text style={{ color: active ? c.brand.primary : c.text, fontWeight: active ? "700" : "500" }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const Row = ({ item, index }) => {
    const ok = item.valid;
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>#{index + 1}</Text>
        <Text style={{ color: ok ? c.states.success : c.states.danger, fontWeight: "700" }}>
          {ok ? "VALID" : "INVALID"}
        </Text>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
          {(item.name || "(no name)")} — {(item.phoneNormalized || item.phoneRaw || "(no phone)")}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={3}>
          {item.message}
        </Text>
        {!ok && (
          <Text style={{ color: c.states.danger, fontSize: 12, marginTop: 4 }}>
            Reason: {item.reason || "—"}
          </Text>
        )}
        {ok && (
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
            {item.encoding} · {item.parts} part{(item.parts || 0) > 1 ? "s" : ""}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Controls */}
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: c.border, gap: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Seg v="all" label="All" />
          <Seg v="valid" label="Valid" />
          <Seg v="invalid" label="Invalid" />
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name, phone, or reason…"
          placeholderTextColor={c.textMuted}
          accessibilityLabel="Search recipients"
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: c.text,
            backgroundColor: c.surface,
          }}
        />
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          Showing {filtered.length} of {validated.length}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: c.border }} />}
        renderItem={({ item, index }) => <Row item={item} index={index} />}
        ListEmptyComponent={
          <EmptyState
            title="No rows to display"
            hint="Try adjusting the filter (All / Valid / Invalid) or clear the search."
          />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        style={{ maxHeight: 420 }}
      />
    </View>
  );
}
