// app/preview.jsx
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { getColors, hexToRgba } from "../assets/colors";
import { getState, subscribe } from "../store/fileStore";

import EmptyState from "../components/EmptyState"; // ← added
import RecipientList from "../components/RecipientList";
import ValidationSummary from "../components/ValidationSummary";

import {
    getValidationState,
    subscribeValidation
} from "../store/validationStore";

function useFileStore() {
  const [s, setS] = useState(getState());
  useEffect(() => {
    const unsub = subscribe(setS);
    return unsub;
  }, []);
  return s;
}

function useValidationStore() {
  const [s, setS] = useState(getValidationState());
  useEffect(() => {
    const unsub = subscribeValidation(setS);
    return unsub;
  }, []);
  return s;
}

export default function PreviewScreen() {
  const c = getColors("light");
  const router = useRouter();
  const fileStore = useFileStore();
  const validationStore = useValidationStore();
  const validated = validationStore.validated || [];
  const counts = validationStore.counts || { total: 0, valid: 0, invalid: 0 };
  const fileMeta = fileStore.fileMeta;
  const mapping = fileStore.mapping || {};
  const headerCount = Array.isArray(fileStore.headers) ? fileStore.headers.length : 0;
  const rowCount = fileStore.rowCount || 0;
  const hasData = validated && validated.length > 0;
  const pagePalette = {
    summaryAccent: "#2563eb",
    editAccent: "#f97316",
    queueAccent: "#9333ea",
    bottomAccent: "#0ea5e9",
  };

  const summaryStyles = {
    borderColor: pagePalette.summaryAccent,
    backgroundColor: hexToRgba(pagePalette.summaryAccent, 0.12),
    headingColor: pagePalette.summaryAccent,
    metaLabel: "#0f172a",
  };

  const editStyles = {
    backgroundColor: hexToRgba(pagePalette.editAccent, 0.12),
    borderColor: pagePalette.editAccent,
    textColor: "#7c2d12",
  };

  const queueCtaStyles = {
    enabledBg: pagePalette.queueAccent,
    disabledBg: hexToRgba(pagePalette.queueAccent, 0.2),
    enabledText: "#fdf4ff",
    disabledText: c.textMuted,
  };


  const metricsPalette = [
    { base: "#14b8a6", label: "#0f172a" },
    { base: "#facc15", label: "#78350f" },
    { base: "#ec4899", label: "#831843" },
    { base: "#38bdf8", label: "#0f172a" },
    { base: "#c084fc", label: "#4c1d95" },
    { base: "#f87171", label: "#7f1d1d" },
  ];
  // footerAnim is referenced below, so ensure it's defined
  const footerAnim = useRef(new Animated.Value(0));
  useEffect(() => {
    Animated.timing(footerAnim.current, {
      toValue: hasData ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [hasData]);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {hasData ? (
        <RecipientList
          validated={validated}
          ListHeaderComponent={
            <>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: summaryStyles.borderColor,
                  backgroundColor: summaryStyles.backgroundColor,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: summaryStyles.headingColor,
                    fontSize: 16,
                    fontWeight: "800",
                    marginBottom: 6,
                  }}
                >
                  Preview & Validate
                </Text>
                <Text style={{ color: summaryStyles.metaLabel, fontSize: 13, marginBottom: 4 }}>
                  File: {fileMeta?.name || "(unnamed)"} · Headers: {headerCount} · Rows: {rowCount}
                </Text>
                <Text style={{ color: summaryStyles.metaLabel, fontSize: 13, marginBottom: 8 }}>
                  Mapping → Name: <Text style={{ fontWeight: "600" }}>{mapping.name || "-"}</Text>, Phone <Text style={{ fontWeight: "600" }}>{mapping.phone || "-"}</Text>, Message <Text style={{ fontWeight: "600" }}>{mapping.message || "-"}</Text>
                </Text>
                <Link href="/import" asChild>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                      alignSelf: "flex-start",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: editStyles.borderColor,
                      backgroundColor: editStyles.backgroundColor,
                    }}
                  >
                    <Text style={{ color: editStyles.textColor, fontWeight: "700" }}>
                      Edit Mapping
                    </Text>
                  </TouchableOpacity>
                </Link>
                {counts.valid > 0 ? (
                  <TouchableOpacity
                    onPress={() => router.push("/queue")}
                    activeOpacity={0.85}
                    style={{
                      marginTop: 12,
                      backgroundColor: queueCtaStyles.enabledBg,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: queueCtaStyles.enabledText,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      Proceed to Queue — {counts.valid} recipients
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: queueCtaStyles.disabledBg,
                      backgroundColor: hexToRgba(pagePalette.queueAccent, 0.08),
                    }}
                  >
                    <Text
                      style={{
                        color: queueCtaStyles.disabledText,
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      Add or validate recipients to enable queueing.
                    </Text>
                  </View>
                )}
              </View>
              <ValidationSummary
                validated={validated}
                counts={counts}
                palette={metricsPalette}
              />
            </>
          }
        />
      ) : (
        <EmptyState
          title="Nothing to preview"
          hint="Pick a file and map columns on the Import screen."
        />
      )}
      {/* Animated footer CTA */}
      {/* Animated footer CTA removed to avoid duplicate proceed button */}
    </SafeAreaView>
  );
}
