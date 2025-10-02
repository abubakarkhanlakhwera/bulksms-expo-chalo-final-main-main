// app/queue.jsx
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { getColors } from "../assets/colors";
import CapabilityBanner from "../components/CapabilityBanner";
import ProgressBar from "../components/ProgressBar";
import QueueControls from "../components/QueueControls";
import StatusChip from "../components/StatusChip";

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

  // banner capability (simulated/native)
  const [cap, setCap] = useState(getCapability());
  useEffect(() => setCap(getCapability()), []);

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
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
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
          When you’re done sending, view the analytics and export invalid rows.
        </Text>
        <Pressable onPress={() => router.push("/report")}>
          <Text style={{ color: c.brand.primary, fontWeight: "700" }}>
            Open Report →
          </Text>
        </Pressable>

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
          flex: 1,
        }}
      >
        <FlatList
          data={queue.items}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: c.border }} />
          )}
          renderItem={({ item }) => <Row item={item} />}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{ color: c.textMuted, textAlign: "center" }}>
                No items. Load from validation via the Start button.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
