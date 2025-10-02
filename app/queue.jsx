// app/queue.jsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { getColors } from "../assets/colors";
import CapabilityBanner from "../components/CapabilityBanner";
import ProgressBar from "../components/ProgressBar";
import QueueControls from "../components/QueueControls";
import StatusChip from "../components/StatusChip";
import TopQuickNav from "../components/TopQuickNav";

import { __emitDeliveryForTests, getCapability } from "../services/sms-bridge";

import { computeProgress } from "../modules/analytics/metrics";
import { makeQueueItem, QStatus } from "../modules/queue/state";

import { useQueueRunner } from "../hooks/useQueueRunner";

import {
    getQueueState,
    resetQueue,
    setItems,
    setRatePerMin,
    subscribeQueue,
} from "../store/queueStore";
import { getValidationState, subscribeValidation } from "../store/validationStore";

import { DEFAULT_RATE_PER_MIN } from "../constants/app";
import {
    getSettingsState,
    initSettings,
    subscribeSettings,
} from "../store/settingsStore";

const formatElapsed = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
};

// --------- local store hooks ----------
function useStores() {
  const [queue, setQueue] = useState(getQueueState());
  const [validation, setValidation] = useState(getValidationState());
  useEffect(() => {
    const u1 = subscribeQueue(setQueue);
    const u2 = subscribeValidation(setValidation);
    return () => {
      u1();
      u2();
    };
  }, []);
  return { queue, validation };
}

function useSettings() {
  const [s, setS] = useState(getSettingsState());
  useEffect(() => {
    let alive = true;
    (async () => {
      await initSettings();
      if (!alive) return;
      setS(getSettingsState());
    })();
    const unsub = subscribeSettings(() => setS(getSettingsState()));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return s;
}

// --------- screen ----------
export default function QueueScreen() {
  const c = getColors("light");
  const router = useRouter();
  const { queue, validation } = useStores();
  const settings = useSettings();
  const { start, pause, stop, setRate } = useQueueRunner();
  const seeded = useRef(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [countdownMs, setCountdownMs] = useState(0);
  const autoStartRef = useRef(0);
  const [scheduleDraft, setScheduleDraft] = useState(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // banner capability (simulated/native)
  const [cap, setCap] = useState(getCapability());
  useEffect(() => setCap(getCapability()), []);

  useEffect(() => {
    if (!queue.scheduledFor) {
      autoStartRef.current = 0;
      setCountdownMs(0);
      return;
    }

    autoStartRef.current = queue.scheduledFor;

    const tick = () => {
      const remaining = queue.scheduledFor - Date.now();
      setCountdownMs(Math.max(0, remaining));
      if (remaining <= 0 && !queue.running && autoStartRef.current !== -1) {
        autoStartRef.current = -1;
        start();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [queue.scheduledFor, queue.running, start]);

  const applySchedule = useCallback(
    (date) => {
      if (!(date instanceof Date)) return;
      start(date);
      setShowSchedulePicker(false);
      setScheduleDraft(null);
    },
    [start]
  );

  const openSchedulePicker = useCallback(() => {
    const base =
      scheduleDraft instanceof Date
        ? scheduleDraft
        : new Date(Date.now() + 5 * 60 * 1000);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: base,
        onChange: (_, pickedDate) => {
          if (!(pickedDate instanceof Date)) {
            return;
          }
          DateTimePickerAndroid.open({
            mode: "time",
            value: pickedDate,
            onChange: (_, pickedTime) => {
              if (!(pickedTime instanceof Date)) {
                return;
              }
              const combined = new Date(pickedDate);
              combined.setHours(pickedTime.getHours());
              combined.setMinutes(pickedTime.getMinutes());
              combined.setSeconds(0, 0);
              applySchedule(combined);
            },
          });
        },
      });
      return;
    }

    setScheduleDraft(base);
    setShowSchedulePicker(true);
  }, [applySchedule, scheduleDraft]);

  const cancelSchedule = useCallback(() => {
    setShowSchedulePicker(false);
    setScheduleDraft(null);
  }, []);

  const confirmSchedule = useCallback(() => {
    if (scheduleDraft instanceof Date) {
      applySchedule(scheduleDraft);
    }
  }, [applySchedule, scheduleDraft]);

  useEffect(() => {
    const tag = "queue-schedule";
    const shouldHoldWake =
      typeof queue.scheduledFor === "number" &&
      queue.scheduledFor > Date.now() &&
      !queue.running &&
      !queue.completedAt;

    if (shouldHoldWake) {
      activateKeepAwakeAsync(tag).catch(() => {});
    } else {
      deactivateKeepAwake(tag);
    }

    return () => {
      deactivateKeepAwake(tag);
    };
  }, [queue.scheduledFor, queue.running, queue.completedAt]);

  useEffect(() => {
    if (!queue.startedAt) {
      setElapsedMs(0);
      return;
    }

    function calcElapsed(anchor = Date.now()) {
      return Math.max(0, anchor - queue.startedAt);
    }

    if (queue.completedAt) {
      setElapsedMs(calcElapsed(queue.completedAt));
      return;
    }

    if (!queue.running) {
      setElapsedMs(calcElapsed());
      return;
    }

    const updateElapsed = () => {
      setElapsedMs(calcElapsed());
    };

    updateElapsed();
    const id = setInterval(updateElapsed, 1000);
    return () => clearInterval(id);
  }, [queue.startedAt, queue.running, queue.completedAt]);

  // seed from validated rows once
  useEffect(() => {
    // If queue is empty, seed as before
    if (!seeded.current) {
      const canSeed =
        queue.items.length === 0 &&
        (validation.validRows?.length || 0) > 0 &&
        settings.loaded;

      if (canSeed) {
        const items = validation.validRows.map((r) =>
          makeQueueItem({
            name: r.name,
            phoneNormalized: r.phoneNormalized,
            message: r.message,
          })
        );
        setItems(items);

        const rate = Math.max(1, Number(settings.defaultRate) || DEFAULT_RATE_PER_MIN);
        setRatePerMin(rate);
        setRate(rate);

        seeded.current = true;
        return;
      }
    }
    // If queue is NOT running, always update the rate to match settings.defaultRate
    if (!queue.running && settings.loaded) {
      const rate = Math.max(1, Number(settings.defaultRate) || DEFAULT_RATE_PER_MIN);
      setRatePerMin(rate);
      setRate(rate);
    }
  }, [queue.items.length, validation.validRows, settings.loaded, settings.defaultRate, setRate, queue.running]);

  // progress — recompute whenever queue state changes (items may be mutated in-place)
  const prog = useMemo(() => computeProgress(queue.items), [queue]);
  const sentSoFar = (queue?.counts?.sent || 0) + (queue?.counts?.delivered || 0);
  const failedSoFar = queue?.counts?.failed || 0;

  // rows
  const Row = ({ item }) => (
    <View style={{ padding: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: c.text, fontWeight: "700" }}>
          {item.name || "(no name)"} — {item.to}
        </Text>
        <StatusChip status={item.status} />
      </View>
      <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={2}>
        {item.message}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
        Attempt {item.attempts} · {item.durationMs ? `${item.durationMs}ms` : "—"}
        {item.lastError ? ` · Err: ${item.lastError}` : ""}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
    >
      <TopQuickNav colors={c} preset="queue" />
      {/* Capability banner */}
      <CapabilityBanner />

      {/* Header */}
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
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
          Queue Console
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          Valid recipients loaded: {validation?.validRows?.length || 0} ·
          Total items: {queue.counts.total} · Queued: {queue.counts.queued}
        </Text>
        <ProgressBar
          pct={prog.pct}
          label={`${prog.done}/${prog.total} done · ${prog.pct}%`}
        />

        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              minWidth: 0,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="time-outline" size={18} color={c.brand.primary} />
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600" }}>
                Time elapsed
              </Text>
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 18 }}>
              {queue.startedAt ? formatElapsed(elapsedMs) : "—"}
            </Text>
            {queue.startedAt && (
              <Text style={{ color: c.textMuted, fontSize: 11 }}>
                Started {new Date(queue.startedAt).toLocaleTimeString()}
              </Text>
            )}
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="paper-plane-outline" size={18} color={c.brand.secondary} />
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "600" }}>
                Messages sent
              </Text>
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 18 }}>
              {sentSoFar}/{queue?.counts?.total || 0}
            </Text>
            <Text style={{ color: failedSoFar ? c.states?.danger || "#DC2626" : c.textMuted, fontSize: 11 }}>
              {failedSoFar ? `${failedSoFar} failed so far` : `Success rate ${(prog.total ? Math.round((sentSoFar / prog.total) * 100) : 0)}%`}
            </Text>
          </View>
        </View>

        {queue.scheduledFor && queue.scheduledFor > Date.now() && (
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
              gap: 4,
            }}
          >
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Scheduled start</Text>
            <Text style={{ color: c.text, fontWeight: "700" }}>
              {new Date(queue.scheduledFor).toLocaleString()}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Starts in {formatElapsed(countdownMs)}
            </Text>
          </View>
        )}

        {/* Daily cap note */}
        {settings.loaded && queue.items.length > settings.dailyCap && (
          <Text style={{ color: c.states.warning, fontSize: 12, marginTop: 6 }}>
            Note: Items exceed your daily cap ({settings.dailyCap}). Consider
            splitting runs.
          </Text>
        )}
        {/* Remaining today (computed from queue sent + delivered) */}
        {settings.loaded && (
          <>
            <Text style={{ color: c.states?.info || c.textMuted, fontSize: 12, marginTop: 6 }}>
              Remaining today: <Text style={{ color: c.states?.success || c.text, fontWeight: "700" }}>{Math.max(0, (Number(settings.dailyCap)||0) - (((queue.counts?.dailySent||0) + (queue.counts?.dailyDelivered||0)) || 0))}</Text>
            </Text>
            {((queue.counts?.dailySent||0) + (queue.counts?.dailyDelivered||0)) >= (Number(settings.dailyCap)||0) && (
              <Text style={{ color: c.states?.danger || '#DC2626', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }}>
                🚨 Daily cap reached! No more messages can be sent today.
              </Text>
            )}
            {settings.lastDailyCapReset && (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                Last reset: {new Date(settings.lastDailyCapReset).toLocaleString()}{"\n"}
                Next reset: {new Date(settings.lastDailyCapReset + 24*60*60*1000).toLocaleString()}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Controls (primary) */}
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          padding: 30,
          borderRadius: 12,
        }}
      >
        <QueueControls
          running={queue.running}
          rate={queue.ratePerMin}
          defaultRate={settings?.defaultRate || DEFAULT_RATE_PER_MIN}
          counts={queue.counts}
          scheduledFor={queue.scheduledFor}
          onStart={start}
          onPause={pause}
          onStop={() => {
            stop();
            resetQueue();
            seeded.current = false;
          }}
          onChangeRate={(n) => {
            setRatePerMin(n);
            setRate(n);
          }}
        />
      </View>

      {/* ---------- Fallback controls (always available) ---------- */}
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surfaceAlt,
          padding: 16,
          borderRadius: 12,
          gap: 8,
        }}
      >
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          Fallback controls (use if Start/Pause above isn’t visible) — running:{" "}
          <Text style={{ color: c.text, fontWeight: "700" }}>
            {String(queue.running)}
          </Text>
          , queued: {queue.counts.queued}
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {!queue.running ? (
            <Pressable
              onPress={start}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.brand.primary,
                backgroundColor: c.brand.primarySoft,
              }}
            >
              <Text style={{ color: c.brand.primary, fontWeight: "700" }}>
                Start (fallback)
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={pause}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.surface,
              }}
            >
              <Text style={{ color: c.text, fontWeight: "700" }}>
                Pause (fallback)
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              stop();
              resetQueue();
              seeded.current = false;
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.states.danger,
              backgroundColor: "rgba(239,68,68,0.08)",
            }}
          >
            <Text style={{ color: c.states.danger, fontWeight: "700" }}>
              Stop (fallback)
            </Text>
          </Pressable>
        </View>
      </View>
      {/* ---------- end fallback ---------- */}

      {/* Below controls helper */}
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          padding: 12,
          borderRadius: 12,
          gap: 6,
        }}
      >
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          Need to double-check recipients before sending? Jump back to the preview screen to validate changes.
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/preview")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: c.brand.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: c.brand.onPrimary, fontWeight: "700" }}>
              ← Preview
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: c.brand.secondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: c.brand.onSecondary, fontWeight: "700" }}>
              Dashboard →
            </Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push("/report")}>
          <Text style={{ color: c.brand.primary, fontWeight: "700", marginTop: 8 }}>
            View Report ↗
          </Text>
        </Pressable>

        <Pressable
          onPress={openSchedulePicker}
          style={{
            marginTop: 10,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: c.brand.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c.brand.onPrimary, fontWeight: "700" }}>
            📅 Schedule Start
          </Text>
        </Pressable>

        {Platform.OS === "ios" && showSchedulePicker && (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surfaceAlt,
              gap: 12,
            }}
          >
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Choose the scheduled start time
            </Text>
            <DateTimePicker
              mode="datetime"
              display="inline"
              value={scheduleDraft || new Date()}
              onChange={(_, date) => {
                if (date instanceof Date) {
                  setScheduleDraft(date);
                }
              }}
            />
            {scheduleDraft instanceof Date && (
              <Text style={{ color: c.text, fontWeight: "700" }}>
                {scheduleDraft.toLocaleString()}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={cancelSchedule}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: c.textMuted, fontWeight: "600" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmSchedule}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: c.brand.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: c.brand.onPrimary, fontWeight: "700" }}>
                  Schedule
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Dev tool: only in simulated mode */}
        {cap.mode === "simulated" && (
          <Pressable
            onPress={() => {
              const firstSent = queue.items.find(
                (i) => i.status === QStatus.SENT && i.messageId
              );
              if (firstSent) {
                __emitDeliveryForTests({
                  messageId: firstSent.messageId,
                  to: firstSent.to,
                  status: "delivered",
                });
              }
            }}
            style={{ marginTop: 6 }}
          >
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Dev: Emit fake delivery for first SENT →
            </Text>
          </Pressable>
        )}
      </View>

      {/* Items */}
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {queue.items.length > 0 ? (
          queue.items.map((item, idx) => (
            <View key={item.id}>
              <Row item={item} />
              {idx < queue.items.length - 1 && (
                <View style={{ height: 1, backgroundColor: c.border }} />
              )}
            </View>
          ))
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={{ color: c.textMuted, textAlign: "center" }}>
              No items. Load from validation via the Start button.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
