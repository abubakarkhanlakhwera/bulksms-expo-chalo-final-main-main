// app/import.jsx
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getColors } from "../assets/colors";
import FilePickerCard from "../components/FilePickerCard";
import { validateRows } from "../modules/validation/validateRows";
import { saveLastSession } from "../services/storage";
import {
  clearSelected,
  getState,
  setMapping,
  setSelectedIndices,
  subscribe,
  toggleSelectedIndex,
} from "../store/fileStore";
import { resetValidation, setValidationResult } from "../store/validationStore";

function useFileStore() {
  const [s, setS] = useState(getState());
  useEffect(() => {
    const unsub = subscribe(setS);
    return unsub;
  }, []);
  return s;
}

// Hard-coded mapping
const FIXED_MAPPING = { name: "Name", phone: "Mobile", message: "Message" };
const REQUIRED_HEADERS = ["Name", "Mobile", "Message"];

export default function ImportScreen() {
  const c = getColors("light");
  const router = useRouter();
  const { headers, mapping, rowCount, fileMeta } = useFileStore();
  const [showMapping, setShowMapping] = useState(false); // hide mapping by default to increase space

  // Access rows and selection via the store snapshot when needed
  const store = getState();

  // Preview window (show all rows, scrollable)
  const previewRows = useMemo(() => {
    const r = Array.isArray(store.rows) ? store.rows : [];
    return r; // show all rows
  }, [store.rows]);

  // Apply hard-coded mapping once headers are available
  useEffect(() => {
    if (!headers || headers.length === 0) return;
    const lower = new Set(headers.map((h) => String(h).trim().toLowerCase()));
    const missing = REQUIRED_HEADERS.filter((h) => !lower.has(h.toLowerCase()));
    if (missing.length === 0) {
      setMapping(FIXED_MAPPING);
      saveLastSession({ fileMeta, mapping: FIXED_MAPPING });
    }
  }, [headers, fileMeta]);

  const mappingReady =
    !!mapping?.name &&
    !!mapping?.phone &&
    !!mapping?.message &&
    mapping.name !== mapping.phone &&
    mapping.name !== mapping.message &&
    mapping.phone !== mapping.message;

  const parsing = !!fileMeta && rowCount === 0;
  const readyToPreview = mappingReady && rowCount > 0;

  const missingHeaders =
    headers && headers.length > 0
      ? REQUIRED_HEADERS.filter(
          (h) =>
            !headers
              .map((x) => String(x).trim().toLowerCase())
              .includes(h.toLowerCase())
        )
      : [];

  // ---- Auto navigate disabled as requested ----
  const autoNavigate = false;
  const autoNavArmed = useRef(false);
  useEffect(() => {
    if (fileMeta) autoNavArmed.current = true;
  }, [fileMeta]);
  useEffect(() => {
    if (autoNavigate && readyToPreview && autoNavArmed.current) {
      autoNavArmed.current = false;
      router.push("/preview");
    }
  }, [autoNavigate, readyToPreview, router]);

  // When a new file is loaded, default-select the preview window rows
  useEffect(() => {
    if (!fileMeta) return;
    const all = previewRows.map((_, i) => i);
    setSelectedIndices(all);
  }, [fileMeta, previewRows]);

  const onToggle = (i) => toggleSelectedIndex(i);
  const onDeselectAll = () => clearSelected();

  const Checkbox = ({ checked }) => (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: checked ? (c.states?.success || "#10B981") : c.border,
        backgroundColor: "transparent",
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {checked ? <Text style={{ color: c.states?.success || "#10B981", fontSize: 12, fontWeight: "700" }}>✓</Text> : null}
    </View>
  );

  const renderRow = ({ item, index }) => {
    const display = item && typeof item === "object" ? Object.values(item).map((v) => String(v ?? "")).join(" · ") : String(item ?? "");
    const s = getState();
    const checked = (s.selected || new Set()).has(index);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onToggle(index)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderColor: c.border,
          backgroundColor: checked ? c.brand.primarySoft : c.surface,
        }}
      >
        <Checkbox checked={checked} />
        <Text style={{ color: c.text, flex: 1 }} numberOfLines={1}>
          {display || "(empty row)"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* 1) Choose CSV/XLSX */}
      <FilePickerCard />

      {/* Preview CTA placed under file picker for easier access */}
      <View style={{ marginTop: 8 }}>
        <TouchableOpacity
          disabled={!readyToPreview || missingHeaders.length > 0}
          onPress={() => {
            // Deterministic: run validation for the current selection and persist it so Preview reads correct data.
            const storeSnapshot = getState();
            const sel = Array.from(storeSnapshot.selected || new Set()).map((n) => Number(n)).filter(Number.isFinite);
            let rowsToValidate = [];
            if (sel && sel.length > 0) rowsToValidate = sel.map((i) => (Array.isArray(storeSnapshot.rows) ? storeSnapshot.rows[i] : undefined)).filter((r) => r !== undefined && r !== null);
            else rowsToValidate = [];

            if (rowsToValidate.length === 0) {
              // explicit empty selection -> clear validation
              resetValidation();
            } else {
              const { rows: outRows, counts: outCounts } = validateRows({ rows: rowsToValidate, mapping });
              setValidationResult({ rows: outRows, counts: outCounts });
            }

            router.push("/preview");
          }}
          style={{
            backgroundColor:
              readyToPreview && missingHeaders.length === 0
                ? c.brand.primary
                : c.brand.primarySoft,
            paddingVertical: 14,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {!readyToPreview && parsing && missingHeaders.length === 0 && (
            <ActivityIndicator size="small" />
          )}
          <Text
            style={{
              color:
                readyToPreview && missingHeaders.length === 0
                  ? c.brand.onPrimary
                  : c.textMuted,
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            {missingHeaders.length > 0
              ? "Fix headers to preview"
              : readyToPreview
              ? "Preview & Validate"
              : parsing
              ? "Parsing…"
              : "Preview (waiting)"}
          </Text>
  </TouchableOpacity>
      </View>

      {/* 2) Info + mapping (read-only hard-coded) */}
      {headers.length > 0 && (
        <>
          {/* Toggle mapping visibility */}
          <TouchableOpacity onPress={() => setShowMapping((s) => !s)} style={{ alignSelf: 'flex-end', padding: 6 }} activeOpacity={0.85}>
            <Text style={{ color: c.textMuted, fontWeight: '700' }}>{showMapping ? 'Hide map' : 'Show map'}</Text>
          </TouchableOpacity>

          {showMapping ? (
            missingHeaders.length > 0 ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: c.states.danger,
                  backgroundColor: "rgba(239,68,68,0.08)",
                  padding: 12,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Text style={{ color: c.states.danger, fontWeight: "800" }}>
                  Missing required headers
                </Text>
                <Text style={{ color: c.text }}>
                  Your file must contain:{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {REQUIRED_HEADERS.join(", ")}
                  </Text>
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>
                  Detected headers: {headers.join(", ") || "—"}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  padding: 12,
                  borderRadius: 12,
                  gap: 6,
                }}
              >
                <Text style={{ color: c.text, fontWeight: "700" }}>
                  Mapped columns (fixed)
                </Text>
                <Text style={{ color: c.text }}>
                  Name → <Text style={{ fontWeight: "700" }}>{FIXED_MAPPING.name}</Text>
                </Text>
                <Text style={{ color: c.text }}>
                  Phone → <Text style={{ fontWeight: "700" }}>{FIXED_MAPPING.phone}</Text>
                </Text>
                <Text style={{ color: c.text }}>
                  Message →{" "}
                  <Text style={{ fontWeight: "700" }}>{FIXED_MAPPING.message}</Text>
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>
                  (Manual mapping UI is disabled.)
                </Text>
              </View>
            )
          ) : null}

          {/* File summary (compact) */}
          <View
            style={{
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              padding: 8,
              borderRadius: 8,
              gap: 6,
              alignItems: 'flex-start'
            }}
          >
            <Text style={{ color: c.text, fontSize: 13 }}>
              File: <Text style={{ fontWeight: "700", fontSize: 13 }}>{fileMeta?.name || "(unnamed)"}</Text>
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Headers: {headers.length} · Rows: {rowCount}
            </Text>
          </View>

          {/* Helper text + CTA */}
          <View style={{ gap: 8 }}>
            {!readyToPreview && missingHeaders.length === 0 && (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                {parsing
                  ? "Parsing file… please wait a moment."
                  : "Rows will appear once parsing is done."}
              </Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={onDeselectAll} style={{ padding: 10 }} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>Deselect All</Text>
                  </TouchableOpacity>
            </View>
          </View>

          {/* Preview rows window (smaller) */}
          {previewRows.length > 0 && (
                <View style={{ marginTop: 10, borderWidth: 1, borderColor: c.border, borderRadius: 8, overflow: 'hidden' }}>
                  <View>
                    {previewRows.map((item, i) => (
                      <View key={String(i)}>
                        {renderRow({ item, index: i })}
                      </View>
                    ))}
                  </View>
                </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
