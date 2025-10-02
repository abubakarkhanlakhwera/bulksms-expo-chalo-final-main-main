import { Alert, AppState } from "react-native";
import { getCapability, sendSms } from "../../services/sms-bridge";
import {
    getQueueState,
    markItemSent,
    setCompletedAt,
    setRunning,
    setScheduledFor,
    updateItemStatus,
} from "../../store/queueStore";
import { getSettingsState } from "../../store/settingsStore";
import { canSend } from "../limits";
import { QStatus } from "./state";

let history = [];
let timerId = null;
let completionShown = false;
let dailyCapAlertShown = false;
let runningFlag = false;
let schedulePollId = null;
let schedulePollFn = null;
let appStateSub = null;

const safeClear = () => {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
};

const ensureScheduleWatcher = () => {
  if (schedulePollId) return;
  schedulePollId = setInterval(() => {
    schedulePollFn?.();
  }, 1000);
};

const stopScheduleWatcher = () => {
  if (schedulePollId) {
    clearInterval(schedulePollId);
    schedulePollId = null;
  }
  schedulePollFn = null;
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
};

const showDailyCapAlert = (message) => {
  if (dailyCapAlertShown) return;
  dailyCapAlertShown = true;
  Alert.alert("Daily cap reached", message, [{ text: "OK", style: "destructive" }]);
};

const checkComplete = () => {
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

  stopScheduleWatcher();
  setScheduledFor(0);
  runningFlag = false;
  setRunning(false);
  setCompletedAt(Date.now());
  safeClear();

  if (completionShown) {
    return;
  }
  completionShown = true;

  Alert.alert("🚨 Task Completed", "All queued messages are finished.", [
    { text: "OK", style: "destructive" },
  ]);
};

const step = () => {
  const queueSnapshot = getQueueState();
  const settings = getSettingsState();

  const cap = Number(settings?.dailyCap) || 0;
  const sentToday =
    (queueSnapshot.counts?.dailySent || 0) +
    (queueSnapshot.counts?.dailyDelivered || 0);

  if (cap > 0 && sentToday >= cap) {
    runningFlag = false;
    setRunning(false);
    stopScheduleWatcher();
    setScheduledFor(0);
    setCompletedAt(Date.now());
    safeClear();
    showDailyCapAlert(
      "Today's send limit is exhausted. Queue stopped until the next reset."
    );
    return;
  }

  const next = queueSnapshot.items.find((i) => i.status === QStatus.QUEUED);
  if (!runningFlag || !next) {
    checkComplete();
    return;
  }

  if (getCapability().mode === "simulated") {
    console.log("Simulated mode – skipping real SMS send.");
  }

  if (!canSend(history)) {
    console.log("⏸ Rate limit reached. Retrying in 60s…");
    timerId = setTimeout(step, 60 * 1000);
    return;
  }

  updateItemStatus(next.id, QStatus.SENDING);

  sendSms(next.to, next.message)
    .then(() => {
      markItemSent(next.id);
      history.push(Date.now());
    })
    .catch((err) => {
      updateItemStatus(next.id, QStatus.FAILED, err.message || "Error");
    })
    .finally(() => {
      checkComplete();
      if (runningFlag) {
        const latestQueue = getQueueState();
        const rate = Number(latestQueue.ratePerMin) || 1;
        timerId = setTimeout(step, (60 / rate) * 1000);
      }
    });
};

const beginRun = () => {
  safeClear();
  history = [];
  runningFlag = true;
  dailyCapAlertShown = false;
  completionShown = false;
  stopScheduleWatcher();
  setScheduledFor(0);
  setCompletedAt(0);
  setRunning(true);
  step();
};

const fireScheduledStartIfDue = () => {
  const latestQueue = getQueueState();
  if (
    !runningFlag &&
    typeof latestQueue.scheduledFor === "number" &&
    latestQueue.scheduledFor > 0 &&
    latestQueue.scheduledFor <= Date.now()
  ) {
    safeClear();
    beginRun();
  }
};

export const startQueue = (scheduledAt = null) => {
  if (runningFlag) return;

  const currentQueue = getQueueState();
  const settings = getSettingsState();
  const cap = Number(settings?.dailyCap) || 0;
  const sentToday =
    (currentQueue.counts?.dailySent || 0) +
    (currentQueue.counts?.dailyDelivered || 0);

  if (cap > 0 && sentToday >= cap) {
    setScheduledFor(0);
    showDailyCapAlert(
      "Today's send limit is already exhausted. Increase the limit or wait for reset."
    );
    return;
  }

  const isValidDate =
    scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime());
  const now = Date.now();

  if (isValidDate) {
    const targetTs = scheduledAt.getTime();
    const delay = targetTs - now;
    if (delay > 1000) {
      safeClear();
      setCompletedAt(0);
      setScheduledFor(targetTs);
      history = [];
      schedulePollFn = fireScheduledStartIfDue;
      ensureScheduleWatcher();
      if (!appStateSub) {
        appStateSub = AppState.addEventListener("change", (status) => {
          if (status === "active") {
            schedulePollFn?.();
          }
        });
      }
      fireScheduledStartIfDue();
      timerId = setTimeout(() => {
        timerId = null;
        const latestQueue = getQueueState();
        const latestSettings = getSettingsState();
        const latestCap = Number(latestSettings?.dailyCap) || 0;
        const latestSent =
          (latestQueue.counts?.dailySent || 0) +
          (latestQueue.counts?.dailyDelivered || 0);
        if (latestCap > 0 && latestSent >= latestCap) {
          setScheduledFor(0);
          showDailyCapAlert(
            "Today's send limit is already exhausted. Increase the limit or wait for reset."
          );
          return;
        }
        beginRun();
      }, delay);

      Alert.alert(
        "Scheduled",
        `Queue will start automatically at ${new Date(targetTs).toLocaleString()}.`,
        [{ text: "OK" }]
      );
      return;
    }
  }

  beginRun();
};

export const pauseQueue = () => {
  runningFlag = false;
  setRunning(false);
  safeClear();
  stopScheduleWatcher();
  setScheduledFor(0);
};

export const stopQueue = () => {
  runningFlag = false;
  setRunning(false);
  safeClear();
  history = [];
  setCompletedAt(0);
  completionShown = false;
  dailyCapAlertShown = false;
  stopScheduleWatcher();
  setScheduledFor(0);
};

export const setRateQueue = (n) => {
  console.log("Rate set to", n, "per min");
};

export const __queueRunnerInternals = {
  get timerId() {
    return timerId;
  },
};
