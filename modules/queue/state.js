// modules/queue/state.jsx
// Queue item model + pure state transitions.

export const QStatus = {
  QUEUED: "queued",
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  CANCELED: "canceled",
};

let __id = 1;
export const nextId = () => (__id++).toString();

export function hydrateQueueIdCounter(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const maxNumericId = items.reduce((max, item) => {
    const value = Number(item?.id);
    if (Number.isFinite(value)) {
      return Math.max(max, value);
    }
    return max;
  }, 0);
  if (maxNumericId >= __id) {
    __id = maxNumericId + 1;
  }
}

export function makeQueueItem({ name, phoneNormalized, phoneRaw, message }) {
  return {
    id: nextId(),
    name,
    to: phoneNormalized, // For SMS sending (with +92)
    toDisplay: phoneRaw || phoneNormalized, // For display (original format)
    message,
    status: QStatus.QUEUED,
    attempts: 0,
    lastError: "",
    startedAt: 0,
    endedAt: 0,
    durationMs: 0,
    messageId: "",
  };
}

export function markSending(item) {
  return { ...item, status: QStatus.SENDING, attempts: item.attempts + 1, startedAt: Date.now(), lastError: "" };
}
export function markSent(item, messageId = "") {
  const endedAt = Date.now();
  return { ...item, status: QStatus.SENT, endedAt, durationMs: endedAt - (item.startedAt || endedAt), messageId };
}
export function markDelivered(item) {
  const endedAt = Date.now();
  return { ...item, status: QStatus.DELIVERED, endedAt, durationMs: endedAt - (item.startedAt || endedAt) };
}
export function markFailed(item, errMsg = "") {
  const endedAt = Date.now();
  return { ...item, status: QStatus.FAILED, endedAt, durationMs: endedAt - (item.startedAt || endedAt), lastError: errMsg };
}
export function markCanceled(item) {
  const endedAt = Date.now();
  return { ...item, status: QStatus.CANCELED, endedAt, durationMs: endedAt - (item.startedAt || endedAt) };
}
