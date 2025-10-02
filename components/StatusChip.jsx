// components/StatusChip.jsx
import React from "react";
import { Text, View } from "react-native";
import { getColors } from "../assets/colors";
import { QStatus } from "../modules/queue/state";

const LABELS = {
  [QStatus.QUEUED]: "Queued",
  [QStatus.SENDING]: "Sending",
  [QStatus.SENT]: "Sent",
  [QStatus.DELIVERED]: "Delivered",
  [QStatus.FAILED]: "Failed",
  [QStatus.CANCELED]: "Canceled",
};

export default function StatusChip({ status }) {
  const c = getColors("light");
  const styles = (() => {
    switch (status) {
      case QStatus.SENDING:
        return { bg: c.brand.accentSoft, fg: c.brand.onAccent, brd: c.brand.accent };
      case QStatus.SENT:
        return { bg: c.brand.secondarySoft, fg: c.brand.secondary, brd: c.brand.secondary };
      case QStatus.DELIVERED:
        return { bg: "rgba(34,197,94,0.12)", fg: c.states.success, brd: c.states.success };
      case QStatus.FAILED:
        return { bg: "rgba(239,68,68,0.12)", fg: c.states.danger, brd: c.states.danger };
      case QStatus.CANCELED:
        return { bg: c.surfaceAlt, fg: c.textMuted, brd: c.border };
      default:
        return { bg: c.brand.primarySoft, fg: c.brand.primary, brd: c.brand.primary };
    }
  })();

  return (
    <View style={{
      alignSelf: "flex-start",
      paddingVertical: 4, paddingHorizontal: 10,
      borderRadius: 999, borderWidth: 1, borderColor: styles.brd, backgroundColor: styles.bg
    }}>
      <Text style={{ color: styles.fg, fontWeight: "700", fontSize: 12 }}>
        {LABELS[status] || status}
      </Text>
    </View>
  );
}
