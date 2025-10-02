// app/settings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import ThreeDButton from "../components/ThreeDButton";
import TopQuickNav from "../components/TopQuickNav";
import { buttonColors } from "../theme/buttonColors";
import { useTheme } from "../theme/ThemeContext";

import {
    getSettingsState,
    initSettings,
    subscribeSettings,
    updateSettings,
} from "../store/settingsStore";

import { DEFAULT_RATE_PER_MIN } from "../constants/app";
import { clearLastSession, loadLastSession } from "../services/storage";
import { resetFile } from "../store/fileStore";
import { resetQueue } from "../store/queueStore";
import { resetValidation } from "../store/validationStore";

function Field({ label, children, colors, labelColor }) {
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      <Text style={{ color: labelColor ?? colors.text, fontWeight: "700" }}>{label}</Text>
      {children}
    </View>
  );
}

const Input = React.memo(function Input({ value, onChange, onCommit, focusedRef, colors, inputRef, multiline, highlightColor }) {
  const isHex = typeof highlightColor === "string" && highlightColor.startsWith("#") && highlightColor.length === 7;
  const placeholderTint = isHex ? `${highlightColor}99` : colors.textMuted;
  const backgroundTint = isHex ? `${highlightColor}14` : colors.surface;
  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={(t) => {
        onChange?.(t);
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        onCommit?.(value);
      }}
      multiline={multiline}
      keyboardType={multiline ? "default" : "number-pad"}
      placeholder={multiline ? "Any custom reminders…" : undefined}
      placeholderTextColor={placeholderTint}
      style={{
        minHeight: multiline ? 80 : undefined,
        borderWidth: 1,
        borderColor: highlightColor ?? colors.border,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        color: highlightColor ?? colors.text,
        backgroundColor: highlightColor ? backgroundTint : colors.surface,
        shadowColor: highlightColor ? highlightColor : undefined,
        shadowOpacity: highlightColor ? 0.2 : undefined,
        shadowOffset: highlightColor ? { width: 0, height: 3 } : undefined,
        shadowRadius: highlightColor ? 10 : undefined,
        elevation: highlightColor ? 3 : undefined,
      }}
    />
  );
});

export default function SettingsScreen() {
  const { mode, colors: themeColors, toggleTheme } = useTheme();
  const colors = useMemo(() => {
    if (mode === "dark") return themeColors;
    return {
      ...themeColors,
      background: "#F4F6FF",
      surface: "#FFFFFF",
      border: "#CBD5F5",
      text: "#1E293B",
      textMuted: "#4C5B7A",
    };
  }, [mode, themeColors]);
  const accent = colors.brand?.primary ?? colors.states.info ?? "#4F46E5";
  const btnColors = buttonColors(mode);

  const dailyInputRef = useRef(null);
  const defaultInputRef = useRef(null);
  const notesInputRef = useRef(null);

  const [settings, setSettings] = useState(getSettingsState());
  const [dailyCap, setDailyCap] = useState(String(settings.dailyCap || 700));
  const [defaultRate, setDefaultRate] = useState(String(settings.defaultRate));
  const [notes, setNotes] = useState(settings.notes || "");
  const dailyFocused = useRef(false);
  const defaultFocused = useRef(false);
  const noteFocused = useRef(false);
  const [lastSession, setLastSession] = useState(null);
  const [msg, setMsg] = useState("");


  useEffect(() => {
    let alive = true;
    (async () => {
      await initSettings();
      if (!alive) return;
      const s = getSettingsState();
      setSettings(s);
      setDailyCap(String(s.dailyCap));
      setDefaultRate(String(s.defaultRate));
      setNotes(s.notes || "");
      setLastSession(await loadLastSession());
    })();

    const unsub = subscribeSettings(() => {
      const s = getSettingsState();
      setSettings(s);
      if (!dailyFocused.current) setDailyCap(String(s.dailyCap));
      if (!defaultFocused.current) setDefaultRate(String(s.defaultRate));
      if (!noteFocused.current) setNotes(s.notes || "");
    });

    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // Keep input state in sync with settings after any change
  useEffect(() => {
    setDailyCap(String(settings.dailyCap));
    setDefaultRate(String(settings.defaultRate));
    setNotes(settings.notes || "");
  }, [settings.dailyCap, settings.defaultRate, settings.notes]);

  const save = async () => {
    try {
      await updateSettings({
        dailyCap: Number(dailyCap),
        defaultRate: Number(defaultRate),
        notes,
      });
      await initSettings(); // reload from storage to ensure latest value
      const s = getSettingsState();
      setMsg(`✅ Settings saved (Cap: ${s.dailyCap}, Rate: ${s.defaultRate})`);
      setDefaultRate(String(s.defaultRate));
      setDailyCap(String(s.dailyCap));
      setNotes(s.notes || "");
    } catch (_err) {
      setMsg('❌ Failed to save settings. Please try again.');
    }
  };

  const resetDefaults = async () => {
    const saved = await updateSettings({ dailyCap: 700, defaultRate: 3, notes: "" });
    setDailyCap(String(saved.dailyCap));
    setDefaultRate(String(saved.defaultRate));
    setNotes(saved.notes || "");
    setMsg("Settings reset to defaults.");
  };

  const clearSession = async () => {
    await clearLastSession();
    try {
      resetFile();
      resetValidation();
      resetQueue();
    } catch (_) {}
    setLastSession(null);
    setMsg("🗑 Last session cleared.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
  <TopQuickNav colors={colors} active="settings" preset="settings" />

      {/* Settings card */}
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
          Settings
        </Text>

        <Field
          label="Daily cap (recipients/day)"
          colors={colors}
          labelColor={accent}
        >
          <Input
            value={dailyCap}
            onChange={setDailyCap}
            onCommit={setDailyCap}
            focusedRef={dailyFocused}
            colors={colors}
            inputRef={dailyInputRef}
            highlightColor={accent}
          />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Used for planning; sending will respect this cap.
          </Text>
        </Field>

        <Field
          label="Default rate (msgs/min)"
          colors={colors}
          labelColor={accent}
        >
          <Input
            value={defaultRate}
            onChange={setDefaultRate}
            onCommit={setDefaultRate}
            focusedRef={defaultFocused}
            colors={colors}
            inputRef={defaultInputRef}
            highlightColor={accent}
          />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Pre-fills the Queue rate when seeding items.
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
            Default:{" "}
            <Text style={{ fontWeight: "700", color: accent }}>{DEFAULT_RATE_PER_MIN}</Text>
          </Text>
        </Field>

        {/* Action buttons */}
        <View style={{ gap: 12, marginVertical: 12 }}>
          <ThreeDButton label="💾 Save" {...btnColors.report} onPress={save} />
          <ThreeDButton
            label="♻ Reset to defaults"
            {...btnColors.settings}
            onPress={resetDefaults}
          />
          <ThreeDButton
            label="🗑 Clear last session"
            {...btnColors.stop}
            onPress={clearSession}
          />
          <ThreeDButton
            label={`🌗 Switch to ${mode === "light" ? "Dark" : "Light"} Mode`}
            {...btnColors.settings}
            onPress={toggleTheme}
          />
        </View>

        <Field label="Notes" colors={colors}>
          <Input
            value={notes}
            onChange={setNotes}
            onCommit={setNotes}
            focusedRef={noteFocused}
            colors={colors}
            inputRef={notesInputRef}
            multiline
          />
        </Field>
      </View>

      {/* Last session card */}
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 16,
          borderRadius: 12,
          gap: 6,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>Last Session</Text>
        {lastSession ? (
          <>
            <Text style={{ color: colors.text }}>
              File:{" "}
              <Text style={{ fontWeight: "700" }}>
                {lastSession?.fileMeta?.name || "(unknown)"}
              </Text>
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Saved: {new Date(lastSession.savedAt).toLocaleString()}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Mapping:{" "}
              {lastSession.mapping
                ? `Name: ${lastSession.mapping.name || "-"}, Phone: ${
                    lastSession.mapping.phone || "-"
                  }, Message: ${lastSession.mapping.message || "-"}`
                : "(none yet)"}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.textMuted }}>No previous session saved.</Text>
        )}
      </View>

        {!!msg && (
          <View style={{ padding: 8 }}>
            <Text style={{ color: colors.states.success, textAlign: "center" }}>{msg}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
