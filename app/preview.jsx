// app/preview.jsx
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "../assets/colors";
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
  const insets = useSafeAreaInsets();
  const fileStore = useFileStore();
  const validationStore = useValidationStore();
  const validated = validationStore.validated || [];
  const counts = validationStore.counts || { total: 0, valid: 0, invalid: 0 };
  const fileMeta = fileStore.fileMeta;
  const mapping = fileStore.mapping || {};
  const headerCount = Array.isArray(fileStore.headers) ? fileStore.headers.length : 0;
  const rowCount = fileStore.rowCount || 0;
  const hasData = validated && validated.length > 0;
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
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: c.text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
                  Preview & Validate
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 4 }}>
                  File: {fileMeta?.name || "(unnamed)"} · Headers: {headerCount} · Rows: {rowCount}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 8 }}>
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
                      borderColor: c.border,
                      backgroundColor: c.surfaceAlt,
                    }}
                  >
                    <Text style={{ color: c.text, fontWeight: "600" }}>Edit Mapping</Text>
                  </TouchableOpacity>
                </Link>
                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity
                    disabled={counts.valid === 0}
                    onPress={() => {
                      router.push("/queue");
                    }}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: counts.valid > 0 ? c.brand.primary : c.brand.primarySoft,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: counts.valid > 0 ? c.brand.onPrimary : c.textMuted,
                        textAlign: "center",
                        fontWeight: "700",
                      }}
                    >
                      {counts.valid > 0
                        ? `Proceed to Queue (Phase 3) — ${counts.valid} recipients`
                        : "No valid recipients yet"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <ValidationSummary validated={validated} counts={counts} />
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
      <Animated.View
        pointerEvents={counts.valid > 0 ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: (insets?.bottom || 0) + 12,
          transform: [
            {
              translateY: footerAnim.current.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
          opacity: footerAnim.current,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/queue')}
          activeOpacity={0.85}
          style={{
            backgroundColor: c.brand.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 6, // Android shadow
            shadowColor: '#000', // iOS shadow
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 6,
          }}
        >
          <Text style={{ color: c.brand.onPrimary, fontWeight: '700' }}>
            Proceed to Queue — {counts.valid} recipients
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
