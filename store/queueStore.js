// store/queueStore.jsx
// Global queue state (no external deps). UI subscribes here.

import { QStatus } from "../modules/queue/state";

const listeners = new Set();

const state = {
  items: [],           // Array<QueueItem>
  ratePerMin: 5,      // default, updated from constants in screen
  running: false,
  startedAt: 0,
  dailyCounts: { sent: 0, delivered: 0 },
  lastCountsReset: Date.now(),
};

function notify() { for (const fn of listeners) fn(getState()); }

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

export function setRunning(running) { state.running = running; if (running) state.startedAt = Date.now(); notify(); }
export function setRatePerMin(r) { state.ratePerMin = Math.max(1, Number(r)||1); notify(); }

export function resetQueue() {
  state.items = [];
  state.running = false;
  state.startedAt = 0;
  // Do NOT reset dailyCounts here
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
