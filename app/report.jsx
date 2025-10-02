// app/report.jsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { getColors } from "../assets/colors";

import ExportBar from "../components/ExportBar";
import FailedMiniList from "../components/FailedMiniList";
import ReportCard from "../components/ReportCard";

import { getQueueState, subscribeQueue } from "../store/queueStore";
import { getValidationState, subscribeValidation } from "../store/validationStore";

import { computeQueueKPIs, computeValidationKPIs } from "../modules/analytics/reporting";

function useStores() {
  const [validation, setValidation] = useState(getValidationState());
  const [queue, setQueue] = useState(getQueueState());
  useEffect(() => {
    const unsubValidation = subscribeValidation(setValidation);
    const unsubQueue = subscribeQueue(setQueue);
    return () => {
      unsubValidation();
      unsubQueue();
    };
  }, []);
  return { validation, queue };
}

export default function ReportScreen() {
  const c = getColors("light");
  const router = useRouter();
  const { validation, queue } = useStores();
  const vKPIs = useMemo(() => computeValidationKPIs(validation.validated || []), [validation.validated]);
  const qKPIs = useMemo(() => computeQueueKPIs(queue.items || []), [queue.items]);
  const successPct = Math.round((qKPIs.successRate || 0) * 100);
  const gradientBg = ["#3B82F6", "#6366F1", "#14B8A6"];
  const footerGradient = ["#F97316", "#F43F5E", "#8B5CF6"];

  // FlatList data: show queue items (if you want to show them), or use empty array for just header/footer
  const data = [];

  const QuickNavigationRow = ({ style, variant = "header" }) => {
    const queueBase = c.brand?.primary || "#4F46E5";
    const dashBase = c.brand?.secondary || "#0EA5E9";
    const isFooter = variant === "footer";
    const queueBg = `${queueBase}${isFooter ? "15" : "12"}`;
    const queueBorder = `${queueBase}${isFooter ? "55" : "44"}`;
    const dashBg = `${dashBase}${isFooter ? "15" : "12"}`;
    const dashBorder = `${dashBase}${isFooter ? "55" : "44"}`;
    const queueColor = queueBase;
    const dashColor = dashBase;
    const paddingVertical = isFooter ? 12 : 10;
    const queueShadow = {
      shadowColor: `${queueBase}66`,
      shadowOpacity: isFooter ? 0.2 : 0.12,
      shadowOffset: { width: 0, height: isFooter ? 4 : 2 },
      shadowRadius: isFooter ? 8 : 5,
      elevation: isFooter ? 4 : 2,
    };
    const dashShadow = {
      shadowColor: `${dashBase}66`,
      shadowOpacity: isFooter ? 0.2 : 0.12,
      shadowOffset: { width: 0, height: isFooter ? 4 : 2 },
      shadowRadius: isFooter ? 8 : 5,
      elevation: isFooter ? 4 : 2,
    };

    return (
      <View style={[{ flexDirection: "row", gap: 12 }, style]}>
        <Pressable
          onPress={() => router.push("/queue")}
          style={{
            flex: 1,
            paddingVertical,
            borderRadius: 12,
            backgroundColor: queueBg,
            borderWidth: 1,
            borderColor: queueBorder,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            ...queueShadow,
          }}
        >
          <Ionicons name="return-up-back-outline" size={18} color={queueColor} />
          <Text style={{ color: queueColor, fontWeight: "700" }}>Back to Queue</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/")}
          style={{
            flex: 1,
            paddingVertical,
            borderRadius: 12,
            backgroundColor: dashBg,
            borderWidth: 1,
            borderColor: dashBorder,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            ...dashShadow,
          }}
        >
          <Ionicons name="home-outline" size={18} color={dashColor} />
          <Text style={{ color: dashColor, fontWeight: "700" }}>Dashboard</Text>
        </Pressable>
      </View>
    );
  };

  // Header: summary and outcomes
  const ListHeaderComponent = (
    <View style={{ gap: 18 }}>
      <QuickNavigationRow />
      <LinearGradient
        colors={gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 22,
          borderRadius: 20,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18,
          elevation: 10,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
        }}
      >
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="analytics-outline" size={22} color={c.brand.onPrimary} />
            <Text style={{ color: c.brand.onPrimary, fontSize: 22, fontWeight: "800" }}>
              Delivery Insights
            </Text>
          </View>
          <Text style={{ color: c.brand.onPrimary, opacity: 0.85, fontSize: 14, lineHeight: 20 }}>
            Review how your import performed, export invalid recipients, and jump back into the flow.
          </Text>
        </View>
      </LinearGradient>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {/* Validation summary */}
        <View
          style={{
            gap: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: `${c.brand.primary}22`,
            backgroundColor: `${c.surface}`,
            padding: 18,
            shadowColor: "#1E3A8A",
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            flex: 1,
            minWidth: 300,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={20} color={c.brand.primary} />
            <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Validation Summary</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <ReportCard title="Total rows" value={vKPIs.total} />
            <ReportCard title="Valid" value={vKPIs.valid} />
            <ReportCard title="Invalid" value={vKPIs.invalid} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <ReportCard title="Est. SMS parts (valid)" value={vKPIs.partsTotal} />
            <ReportCard title="Avg parts / recipient" value={vKPIs.valid ? vKPIs.avgParts.toFixed(2) : "0.00"} />
            <ReportCard title="Encoding mix" value={`GSM-7: ${vKPIs.encMix.gsm7} · UCS-2: ${vKPIs.encMix.ucs2}`} />
          </View>
        </View>
        {/* Queue outcomes */}
        <View
          style={{
            gap: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: `${c.brand.secondary}22`,
            backgroundColor: `${c.surface}`,
            padding: 18,
            shadowColor: "#0F766E",
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            flex: 1,
            minWidth: 300,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="stats-chart-outline" size={20} color={c.brand.secondary} />
            <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Queue Outcomes</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <ReportCard title="Total items" value={qKPIs.counts.total} />
            <ReportCard title="Sent" value={qKPIs.counts.sent} />
            <ReportCard title="Delivered" value={qKPIs.counts.delivered} />
            <ReportCard title="Failed" value={qKPIs.counts.failed} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <ReportCard title="Completed" value={qKPIs.completed} />
            <ReportCard title="Success rate" value={`${successPct}%`} />
            <ReportCard title="Avg attempts" value={qKPIs.avgAttempts.toFixed(2)} />
            <ReportCard title="Avg duration" value={qKPIs.avgDurationMs ? `${qKPIs.avgDurationMs} ms` : "—"} />
          </View>
        </View>
      </View>
    </View>
  );

  // Footer: failed rows and export
  const ListFooterComponent = (
    <LinearGradient
      colors={footerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 22,
        shadowColor: "#b45309",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 16,
        elevation: 9,
      }}
    >
      <View
        style={{
          gap: 16,
          borderRadius: 20,
          padding: 20,
          backgroundColor: "rgba(255,255,255,0.94)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="warning-outline" size={20} color={c.states.warning} />
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Failed Rows</Text>
        </View>
        <View style={{
          borderRadius: 16,
          padding: 12,
          backgroundColor: `${c.states.warning}0F`,
          borderWidth: 1,
          borderColor: `${c.states.warning}33`,
        }}>
          <FailedMiniList invalidRows={validation.invalidRows || []} />
        </View>
        <ExportBar validated={validation.validated || []} />
        <View style={{ paddingTop: 4 }}>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center" }}>
            Tip: Use “Share failed.csv” to send invalid rows for correction.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <FlatList
      data={data}
      renderItem={null}
      keyExtractor={(_, idx) => idx.toString()}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{ padding: 16, gap: 16, backgroundColor: c.background, paddingBottom: 32 }}
      style={{ backgroundColor: c.background }}
    />
  );
}
