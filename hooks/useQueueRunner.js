// hooks/useQueueRunner.jsx
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { canSend } from "../modules/limits"; // helper from modules/limits.js
import { QStatus } from "../modules/queue/state";
import { getCapability, sendSms } from "../services/sms-bridge";
import {
    getQueueState,
    markItemSent,
    setCompletedAt,
    setRunning,
    updateItemStatus,
} from "../store/queueStore";
import { getSettingsState } from "../store/settingsStore";

// --- Hook ---
export function useQueueRunner() {
  const historyRef = useRef([]); // timestamps of sent messages
  const timerRef = useRef(null);
  const completionShownRef = useRef(false);
  const dailyCapAlertShownRef = useRef(false);
  const runningRef = useRef(false);

  // ---- helpers ----
  const safeClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => safeClear(), []);

  const checkComplete = useCallback(() => {
    const { items, completedAt } = getQueueState();
    if (completedAt) {
      return;
    }
    const done = items.every(
      (i) =>
        i.status === QStatus.SENT ||
        i.status === QStatus.DELIVERED ||
        i.status === QStatus.FAILED ||
        i.status === QStatus.CANCELED
    );
    if (!done || items.length === 0) {
      return;
    }

    runningRef.current = false;
    setRunning(false);
    setCompletedAt(Date.now());
    safeClear();

    if (completionShownRef.current) {
      return;
    }
    completionShownRef.current = true;

    Alert.alert("🚨 Task Completed", "All queued messages are finished.", [
      { text: "OK", style: "destructive" },
    ]);
  }, []);

  // ---- main runner ----
  const step = useCallback(() => {
    const q = getQueueState();
    const settings = getSettingsState();

    const cap = Number(settings?.dailyCap) || 0;
    const sentToday = (q.counts?.dailySent || 0) + (q.counts?.dailyDelivered || 0);
    if (cap > 0 && sentToday >= cap) {
      runningRef.current = false;
      setRunning(false);
      setCompletedAt(Date.now());
      safeClear();

      if (!dailyCapAlertShownRef.current) {
        dailyCapAlertShownRef.current = true;
        Alert.alert(
          "Daily cap reached",
          "Today's send limit is exhausted. Queue stopped until the next reset.",
          [{ text: "OK", style: "destructive" }]
        );
      }
      return;
    }

    const next = q.items.find((i) => i.status === QStatus.QUEUED);
    if (!runningRef.current || !next) {
      checkComplete();
      return;
    }

    if (getCapability().mode === "simulated") {
      console.log("Simulated mode – skipping real SMS send.");
    }

    if (!canSend(historyRef.current)) {
      console.log("⏸ Rate limit reached. Retrying in 60s…");
      timerRef.current = setTimeout(step, 60 * 1000);
      return;
    }

    updateItemStatus(next.id, QStatus.SENDING);

    sendSms(next.to, next.message)
      .then(() => {
        markItemSent(next.id);
        historyRef.current.push(Date.now());
      })
      .catch((err) => {
        updateItemStatus(next.id, QStatus.FAILED, err.message || "Error");
      })
      .finally(() => {
        checkComplete();
        timerRef.current = setTimeout(step, (60 / q.ratePerMin) * 1000);
      });
  }, [checkComplete]);

  // ---- API ----
  const start = useCallback(
    (scheduledAt = null) => {
      if (runningRef.current) return;
      const settings = getSettingsState();
      const cap = Number(settings?.dailyCap) || 0;
      const currentQueue = getQueueState();
      const sentToday =
        (currentQueue.counts?.dailySent || 0) +
        (currentQueue.counts?.dailyDelivered || 0);

      if (cap > 0 && sentToday >= cap) {
        if (!dailyCapAlertShownRef.current) {
          dailyCapAlertShownRef.current = true;
          Alert.alert(
            "Daily cap reached",
            "Today's send limit is already exhausted. Increase the limit or wait for reset.",
            [{ text: "OK", style: "destructive" }]
          );
        }
        return;
      }

      runningRef.current = true;
      setRunning(true);
      completionShownRef.current = false;
      dailyCapAlertShownRef.current = false;

      // scheduled start
      if (scheduledAt && scheduledAt > new Date()) {
        const delay = scheduledAt.getTime() - Date.now();
        console.log("⏰ Scheduled start in", delay / 1000, "s");
        timerRef.current = setTimeout(step, delay);
        return;
      }

      step();
    },
    [step]
  );

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    safeClear();
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    safeClear();
    historyRef.current = [];
    setCompletedAt(0);
    completionShownRef.current = false;
    dailyCapAlertShownRef.current = false;
  }, []);

  const setRate = useCallback((n) => {
    // rate already respected in step delay
    console.log("Rate set to", n, "per min");
  }, []);

  return { start, pause, stop, setRate };
}
