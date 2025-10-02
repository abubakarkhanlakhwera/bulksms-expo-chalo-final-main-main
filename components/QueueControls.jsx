// components/QueueControls.jsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { buttonColors } from "../theme/buttonColors";
import { useTheme } from "../theme/ThemeContext";
import ThreeDButton from "./ThreeDButton";

export default function QueueControls({
  running,
  rate,
  defaultRate,
  counts,
  onStart,
  onPause,
  onStop,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  const { mode, colors } = useTheme();
  const btnColors = buttonColors(mode);

  const handleDateChange = (event, date) => {
    // Android closes automatically
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    // If no event or dismissed, just return
    if (!event || event.type === "dismissed" || !date) {
      return;
    }

    // Confirmed: update state
    if (event.type === "set") {
      setScheduledAt(date);
    }
  };

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
          label={scheduledAt ? "⏰ Start Scheduled" : "🚀 Start Now"}
          {...btnColors.start}
          onPress={() => (scheduledAt ? onStart(scheduledAt) : onStart())}
        />
      ) : (
        <ThreeDButton label="⏸ Pause" {...btnColors.pause} onPress={onPause} />
      )}

      <ThreeDButton label="🛑 Stop" {...btnColors.stop} onPress={onStop} />

      <Text style={{ color: colors.textMuted, fontSize: 13 }}>
        Rate: {rate || defaultRate} / min · Total: {counts.total} · Queued:{" "}
        {counts.queued}
      </Text>

      <ThreeDButton
        label={
          scheduledAt
            ? `📅 Scheduled: ${scheduledAt.toLocaleString()}`
            : "📅 Pick Schedule Time"
        }
        {...btnColors.schedule}
        onPress={() => setShowPicker(true)}
      />

      {showPicker && (
        <DateTimePicker
          mode="datetime"
          value={scheduledAt || new Date()}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}
