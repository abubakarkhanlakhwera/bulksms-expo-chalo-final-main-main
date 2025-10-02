// components/ProgressBar.jsx
// Determinate progress with counters

import React from "react";
import { Text, View } from "react-native";
import { getColors } from "../assets/colors";

/**
 * Props:
 *  - pct:   number (0..100). Progress percentage.
 *  - label: string (optional). If absent, auto "XX%" or "done/total • XX%".
 *  - height: number (optional, default 12).
 *  - done, total: numbers (optional) — label کو خود بنانے کیلئے۔
 */
function ProgressBarInner({ pct = 0, label, height = 12, done, total }) {
  const c = getColors("light");
  const n = Number.isFinite(pct) ? pct : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(n)));

  // Build label if not provided
  let computedLabel = label;
  if (!computedLabel) {
    if (Number.isFinite(done) && Number.isFinite(total) && total > 0) {
      computedLabel = `${done}/${total} • ${clamped}%`;
    } else {
      computedLabel = `${clamped}%`;
    }
  }

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ now: clamped, min: 0, max: 100 }}
      style={{ gap: 8 }}
    >
      <View
        style={{
          height,
          backgroundColor: c.surfaceAlt,
          borderRadius: 999,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <View
          style={{
            width: `${clamped}%`,
            height: "100%",
            backgroundColor: c.brand.primary,
          }}
        />
      </View>

      {!!computedLabel && (
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{computedLabel}</Text>
      )}
    </View>
  );
}

const ProgressBar = React.memo(ProgressBarInner);
export default ProgressBar;
