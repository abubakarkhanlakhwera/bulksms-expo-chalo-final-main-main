// store/queueStore.jsx
// Global queue state (no external deps). UI subscribes here.

import { QStatus, hydrateQueueIdCounter } from "../modules/queue/state";
import { loadQueueSnapshot, saveQueueSnapshot } from "../services/storage";

const listeners = new Set();

const state = {
  items: [],           // Array<QueueItem>
  ratePerMin: 5,      // default, updated from constants in screen
  running: false,
  startedAt: 0,
  completedAt: 0,
  scheduledFor: 0,
  dailyCounts: { sent: 0, delivered: 0 },
  lastCountsReset: Date.now(),
  hydrated: false,
};

let hydrationPromise = null;

function snapshotForPersistence() {
  return {
    items: state.items.map((item) => ({ ...item })),
    ratePerMin: state.ratePerMin,
    running: state.running,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    scheduledFor: state.scheduledFor,
    dailyCounts: { ...state.dailyCounts },
    lastCountsReset: state.lastCountsReset,
  };
}

function persistQueueState() {
  if (!state.hydrated) return;
  const payload = snapshotForPersistence();
  saveQueueSnapshot(payload).catch(() => {});
}

function notify() {
  const snapshot = getState();
  for (const fn of listeners) fn(snapshot);
  persistQueueState();
}

function sanitizeQueueItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const allowedStatuses = new Set(Object.values(QStatus));
  const status = allowedStatuses.has(raw.status) ? raw.status : QStatus.QUEUED;

  return {
    id: raw.id != null ? String(raw.id) : Math.random().toString(36).slice(2, 10),
    name: raw.name ?? "",
    to: raw.to ?? "",
    message: raw.message ?? "",
    status,
    attempts: Number(raw.attempts) || 0,
    lastError: raw.lastError ?? "",
    startedAt: Number(raw.startedAt) || 0,
    endedAt: Number(raw.endedAt) || 0,
    durationMs: Number(raw.durationMs) || 0,
    messageId: raw.messageId ?? "",
  };
}

export function initQueueStore() {
  if (state.hydrated) {
    return Promise.resolve({ shouldResume: false, scheduledAt: null });
  }
  if (hydrationPromise) return hydrationPromise;

  const promise = (async () => {
    let shouldResume = false;
    let resumeSchedule = null;

    try {
      const snapshot = await loadQueueSnapshot();
      if (snapshot) {
        const restoredItems = Array.isArray(snapshot.items)
          ? snapshot.items.map(sanitizeQueueItem).filter(Boolean)
          : [];

        state.items = restoredItems.map((item) =>
          item.status === QStatus.SENDING ? { ...item, status: QStatus.QUEUED } : item
        );
        state.ratePerMin = Math.max(1, Number(snapshot.ratePerMin) || state.ratePerMin);
        state.startedAt = Number(snapshot.startedAt) || 0;
        state.completedAt = Number(snapshot.completedAt) || 0;
        state.scheduledFor = Number(snapshot.scheduledFor) || 0;
        state.dailyCounts = {
          sent: Number(snapshot.dailyCounts?.sent) || 0,
          delivered: Number(snapshot.dailyCounts?.delivered) || 0,
        };
        state.lastCountsReset = Number(snapshot.lastCountsReset) || Date.now();

        hydrateQueueIdCounter(state.items);

        const now = Date.now();
        const hasQueueable = state.items.some((item) => item.status === QStatus.QUEUED);
        const hadRunning = !!snapshot.running;
        const hasSchedule =
          typeof state.scheduledFor === "number" && state.scheduledFor > 0 && hasQueueable;

        if (hasSchedule) {
          if (state.scheduledFor > now + 1000) {
            resumeSchedule = new Date(state.scheduledFor);
          } else if (state.scheduledFor > now) {
            resumeSchedule = new Date(state.scheduledFor);
          } else {
            shouldResume = true;
          }
        }

        if (hadRunning && hasQueueable && !resumeSchedule) {
          shouldResume = true;
        }
      }
    } catch (err) {
      console.log("queueStore hydrate error", err);
    }

    state.running = false;
    state.hydrated = true;
    notify();

    return { shouldResume, scheduledAt: resumeSchedule };
  })();

  hydrationPromise = promise.finally(() => {
    hydrationPromise = null;
  });

  return promise;
}

export function subscribeQueue(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getQueueState() { return getState(); }

export function getState() {
  // 24-hour reset logic for dailyCounts
  const now = Date.now();
  if (now - state.lastCountsReset > 24 * 60 * 60 * 1000) {
    state.dailyCounts = { sent: 0, delivered: 0 };
    state.lastCountsReset = now;
  }
  // Calculate current session counts
  const sessionCounts = {
    total: state.items.length,
    queued: state.items.filter((i) => i.status === QStatus.QUEUED).length,
    sending: state.items.filter((i) => i.status === QStatus.SENDING).length,
    sent: state.items.filter((i) => i.status === QStatus.SENT).length,
    delivered: state.items.filter((i) => i.status === QStatus.DELIVERED).length,
    failed: state.items.filter((i) => i.status === QStatus.FAILED).length,
    canceled: state.items.filter((i) => i.status === QStatus.CANCELED).length,
  };
  // Return both session and daily counts
  return { ...state, counts: { ...sessionCounts, dailySent: state.dailyCounts.sent, dailyDelivered: state.dailyCounts.delivered } };
}

export function setItems(items) { state.items = items || []; notify(); }
// Call this when a message is sent
export function incrementDailySent() {
  state.dailyCounts.sent += 1;
  notify();
}
// Call this when a message is delivered
export function incrementDailyDelivered() {
  state.dailyCounts.delivered += 1;
  notify();
}

export function updateItem(id, updater) {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  state.items[idx] = updater(state.items[idx]);
  notify();
}

// Add this function to update item status directly
export function updateItemStatus(id, status) {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  state.items[idx] = { ...state.items[idx], status };
  notify();
}

export function setRunning(running) {
  state.running = running;
  if (running) {
    state.startedAt = Date.now();
    state.completedAt = 0;
    state.scheduledFor = 0;
  }
  notify();
}
export function setRatePerMin(r) { state.ratePerMin = Math.max(1, Number(r)||1); notify(); }

export function resetQueue() {
  state.items = [];
  state.running = false;
  state.startedAt = 0;
  state.completedAt = 0;
  state.scheduledFor = 0;
  // Do NOT reset dailyCounts here
  notify();
}
export function setCompletedAt(ts) {
  if (typeof ts === "number") {
    state.completedAt = ts;
  } else {
    state.completedAt = Date.now();
  }
  notify();
}

export function setScheduledFor(ts) {
  if (typeof ts === "number" && ts > 0) {
    state.scheduledFor = ts;
  } else {
    state.scheduledFor = 0;
  }
  notify();
}

// New function to reset daily sent/delivered SMS counts
export function resetDailyCounts() {
  state.dailyCounts = { sent: 0, delivered: 0 };
  state.lastCountsReset = Date.now();
  notify();
}

export function markItemSent(id) {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  if (state.items[idx].status !== QStatus.SENT) {
    state.items[idx] = { ...state.items[idx], status: QStatus.SENT };
    state.dailyCounts.sent += 1;
    notify();
  }
}
