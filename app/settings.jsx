// app/settings.jsx
import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import ThreeDButton from "../components/ThreeDButton";
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
import { getQueueState, resetQueue } from "../store/queueStore";
import { resetValidation } from "../store/validationStore";

function Field({ label, children, c }) {
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      <Text style={{ color: c.text, fontWeight: "700" }}>{label}</Text>
      {children}
    </View>
  );
}

const Input = React.memo(function Input({ initialValue, onCommit, focusedRef, c, inputRef, multiline }) {
  const [local, setLocal] = useState(initialValue);
  useEffect(() => {
    if (!focusedRef.current) setLocal(initialValue);
  }, [initialValue, focusedRef]);
  return (
    <TextInput
      ref={inputRef}
      value={local}
      onChangeText={(t) => setLocal(t)}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
        onCommit(local);
      }}
      multiline={multiline}
      keyboardType={multiline ? "default" : "number-pad"}
      placeholder={multiline ? "Any custom reminders…" : undefined}
      placeholderTextColor={c.textMuted}
      style={{
        minHeight: multiline ? 80 : undefined,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        color: c.text,
        backgroundColor: c.surface,
      }}
    />
  );
});

export default function SettingsScreen() {
  const { mode, colors: c, toggleTheme } = useTheme();
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
  const [queueState, setQueueState] = useState(getQueueState());

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

    setQueueState(getQueueState());
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
    } catch (e) {
      setMsg('❌ Failed to save settings. Please try again.');
    }
  };

  const resetDefaults = async () => {
    const saved = await updateSettings({ dailyCap: 700, defaultRate: 5, notes: "" });
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
    <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: c.background }}>
      {/* Settings card */}
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>
          Settings
        </Text>

        <Field label="Daily cap (recipients/day)" c={c}>
          <Input
            initialValue={dailyCap}
            onCommit={setDailyCap}
            focusedRef={dailyFocused}
            c={c}
            inputRef={dailyInputRef}
          />
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            Used for planning; sending will respect this cap.
          </Text>
        </Field>

        <Field label="Default rate (msgs/min)" c={c}>
          <Input
            initialValue={defaultRate}
            onCommit={setDefaultRate}
            focusedRef={defaultFocused}
            c={c}
            inputRef={defaultInputRef}
          />
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            Pre-fills the Queue rate when seeding items.
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
            Default:{" "}
            <Text style={{ fontWeight: "700", color: c.text }}>{DEFAULT_RATE_PER_MIN}</Text>
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

        <Field label="Notes" c={c}>
          <Input
            initialValue={notes}
            onCommit={setNotes}
            focusedRef={noteFocused}
            c={c}
            inputRef={notesInputRef}
            multiline
          />
        </Field>
      </View>

      {/* Last session card */}
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          padding: 16,
          borderRadius: 12,
          gap: 6,
        }}
      >
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>Last Session</Text>
        {lastSession ? (
          <>
            <Text style={{ color: c.text }}>
              File:{" "}
              <Text style={{ fontWeight: "700" }}>
                {lastSession?.fileMeta?.name || "(unknown)"}
              </Text>
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Saved: {new Date(lastSession.savedAt).toLocaleString()}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Mapping:{" "}
              {lastSession.mapping
                ? `Name: ${lastSession.mapping.name || "-"}, Phone: ${
                    lastSession.mapping.phone || "-"
                  }, Message: ${lastSession.mapping.message || "-"}`
                : "(none yet)"}
            </Text>
          </>
        ) : (
          <Text style={{ color: c.textMuted }}>No previous session saved.</Text>
        )}
      </View>

      {!!msg && (
        <View style={{ padding: 8 }}>
          <Text style={{ color: c.states.success, textAlign: "center" }}>{msg}</Text>
        </View>
      )}
    </View>
  );
}
