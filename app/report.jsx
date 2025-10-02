// app/report.jsx
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
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
  const { validation, queue } = useStores();
  const vKPIs = useMemo(() => computeValidationKPIs(validation.validated || []), [validation.validated]);
  const qKPIs = useMemo(() => computeQueueKPIs(queue.items || []), [queue.items]);
  const successPct = Math.round((qKPIs.successRate || 0) * 100);

  // FlatList data: show queue items (if you want to show them), or use empty array for just header/footer
  const data = [];

  // Header: summary and outcomes
  const ListHeaderComponent = (
    <View style={{ gap: 16 }}>
      {/* Validation summary */}
      <View style={{ gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Validation Summary</Text>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <ReportCard title="Total rows" value={vKPIs.total} />
          <ReportCard title="Valid" value={vKPIs.valid} />
          <ReportCard title="Invalid" value={vKPIs.invalid} />
        </View>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <ReportCard title="Est. SMS parts (valid)" value={vKPIs.partsTotal} />
          <ReportCard title="Avg parts / recipient" value={vKPIs.valid ? vKPIs.avgParts.toFixed(2) : "0.00"} />
          <ReportCard title="Encoding mix" value={`GSM-7: ${vKPIs.encMix.gsm7} · UCS-2: ${vKPIs.encMix.ucs2}`} />
        </View>
      </View>
      {/* Queue outcomes */}
      <View style={{ gap: 12 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Queue Outcomes</Text>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <ReportCard title="Total items" value={qKPIs.counts.total} />
          <ReportCard title="Sent" value={qKPIs.counts.sent} />
          <ReportCard title="Delivered" value={qKPIs.counts.delivered} />
          <ReportCard title="Failed" value={qKPIs.counts.failed} />
        </View>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <ReportCard title="Completed" value={qKPIs.completed} />
          <ReportCard title="Success rate" value={`${successPct}%`} />
          <ReportCard title="Avg attempts" value={qKPIs.avgAttempts.toFixed(2)} />
          <ReportCard title="Avg duration" value={qKPIs.avgDurationMs ? `${qKPIs.avgDurationMs} ms` : "—"} />
        </View>
      </View>
    </View>
  );

  // Footer: failed rows and export
  const ListFooterComponent = (
    <View style={{ gap: 12 }}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Failed Rows</Text>
      <FailedMiniList invalidRows={validation.invalidRows || []} />
      <ExportBar validated={validation.validated || []} />
      <View style={{ padding: 8 }}>
        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center" }}>
          Tip: Use “Share failed.csv” to send invalid rows for correction.
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={null}
      keyExtractor={(_, idx) => idx.toString()}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    />
  );
}
