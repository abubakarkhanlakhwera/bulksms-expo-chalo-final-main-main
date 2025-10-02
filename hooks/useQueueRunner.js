// hooks/useQueueRunner.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { canSend } from "../modules/limits"; // helper from modules/limits.js
import { QStatus } from "../modules/queue/state";
import { getCapability } from "../services/sms-bridge";
import {
  getQueueState,
  markItemSent,
  setRunning,
  subscribeQueue,
  updateItemStatus,
} from "../store/queueStore";

// SMS bridge
import { sendSms } from "../services/sms-bridge";

// --- Hook ---
export function useQueueRunner() {
  const [queue, setQueue] = useState(getQueueState());
  const historyRef = useRef([]); // timestamps of sent messages
  const timerRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeQueue((q) => {
      setQueue(q);
    });
    return () => unsub();
  }, []);

  // ---- helpers ----
  const safeClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const checkComplete = useCallback(() => {
    const items = getQueueState().items;
    const done = items.every(
      (i) =>
        i.status === QStatus.SENT ||
        i.status === QStatus.DELIVERED ||
        i.status === QStatus.FAILED
    );
    if (done && items.length > 0) {
      runningRef.current = false;
      setRunning(false);
      safeClear();

      // 🔴 Show completion popup
      Alert.alert("🚨 Task Completed", "All queued messages are finished.", [
        { text: "OK", style: "destructive" },
      ]);
    }
  }, []);

  // ---- main runner ----
  const step = useCallback(() => {
    const q = getQueueState();
    const next = q.items.find((i) => i.status === QStatus.QUEUED);
    if (!runningRef.current || !next) {
      checkComplete();
      return;
    }

    // Respect SMS provider capability
    if (getCapability().mode === "simulated") {
      console.log("Simulated mode – skipping real SMS send.");
    }

    // enforce limits
    if (!canSend(historyRef.current)) {
      console.log("⏸ Rate limit reached. Retrying in 60s…");
      timerRef.current = setTimeout(step, 60 * 1000);
      return;
    }

    // Update item → sending
    updateItemStatus(next.id, QStatus.SENDING);

    // actually send
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
        timerRef.current = setTimeout(step, (60 / q.ratePerMin) * 1000); // rate control
      });
  }, [checkComplete]);

  // ---- API ----
  const start = useCallback(
    (scheduledAt = null) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);

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
  }, []);

  const setRate = useCallback((n) => {
    // rate already respected in step delay
    console.log("Rate set to", n, "per min");
  }, []);

  return { start, pause, stop, setRate };
}
