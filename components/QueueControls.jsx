import { Text, View } from "react-native";
import { buttonColors } from "../theme/buttonColors";
import { useTheme } from "../theme/ThemeContext";
import ThreeDButton from "./ThreeDButton";

export default function QueueControls({
  running,
  rate,
  defaultRate,
  counts,
  scheduledFor,
  onStart,
  onPause,
  onStop,
}) {
  const { mode, colors } = useTheme();
  const btnColors = buttonColors(mode);
  const scheduledForDisplay =
    typeof scheduledFor === "number" && scheduledFor > Date.now()
      ? new Date(scheduledFor).toLocaleString()
      : null;

  return (
    <View style={{ gap: 16 }}>
      <Text
        style={{
          fontWeight: "700",
          fontSize: 16,
          color: colors.text,
          marginBottom: 4,
        }}
      >
        Queue Controls
      </Text>

      {!running ? (
        <ThreeDButton
          label="🚀 Start Now"
          {...btnColors.start}
          onPress={onStart}
        />
      ) : (
        <ThreeDButton label="⏸ Pause" {...btnColors.pause} onPress={onPause} />
      )}

      <ThreeDButton label="🛑 Stop" {...btnColors.stop} onPress={onStop} />

      <Text style={{ color: colors.textMuted, fontSize: 13 }}>
        Rate: {rate || defaultRate} / min · Total: {counts.total} · Queued: {counts.queued}
      </Text>

      {scheduledForDisplay && (
        <View
          style={{
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceAlt,
            gap: 4,
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Next run scheduled
          </Text>
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            {scheduledForDisplay}
          </Text>
        </View>
      )}
    </View>
  );
}
