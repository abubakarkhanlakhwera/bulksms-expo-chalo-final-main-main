// components/CapabilityBanner.jsx
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { getColors } from "../assets/colors";
import { getCapability } from "../services/sms-bridge";

export default function CapabilityBanner() {
  const c = getColors("light");
  const [cap, setCap] = useState({ mode: "simulated", canSend: false, notes: "" });

  useEffect(() => {
    setCap(getCapability());
  }, []);

  const tone =
    cap.mode === "native"
      ? { bg: "rgba(34,197,94,0.12)", fg: c.states.success, brd: c.states.success } // green
      : { bg: c.brand.accentSoft, fg: c.brand.onAccent, brd: c.brand.accent }; // amber

  return (
    <View style={{
      borderWidth: 1, borderColor: tone.brd, backgroundColor: tone.bg,
      padding: 10, borderRadius: 10
    }}>
      <Text style={{ color: tone.fg, fontWeight: "800" }}>
        SMS Bridge: {cap.mode === "native" ? "Native" : "Simulated"}
      </Text>
      {!!cap.notes && (
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{cap.notes}</Text>
      )}
    </View>
  );
}
