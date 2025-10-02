// modules/analytics/reporting.jsx
// KPIs for validation & queue outcomes

import { QStatus } from "../queue/state";

export function computeValidationKPIs(validated = []) {
  const total = validated.length;
  let valid = 0, invalid = 0, parts = 0, encGsm = 0, encUcs2 = 0;

  for (const r of validated) {
    if (r.valid) {
      valid++;
      parts += r.parts || 0;
      if (r.encoding === "GSM-7") encGsm++;
      if (r.encoding === "UCS-2") encUcs2++;
    } else {
      invalid++;
    }
  }

  const avgParts = valid ? parts / valid : 0;

  return {
    total, valid, invalid, partsTotal: parts, avgParts,
    encMix: { gsm7: encGsm, ucs2: encUcs2 },
  };
}

export function computeQueueKPIs(items = []) {
  const counts = {
    total: items.length,
    queued: 0, sending: 0, sent: 0, delivered: 0, failed: 0, canceled: 0,
  };
  let totalDuration = 0, durationN = 0, attemptsSum = 0;

  for (const it of items) {
    counts[it.status] = (counts[it.status] || 0) + 1;
    if (it.durationMs) { totalDuration += it.durationMs; durationN++; }
    attemptsSum += it.attempts || 0;
  }

  const completed = counts.sent + counts.delivered + counts.failed + counts.canceled;
  const success = counts.sent + counts.delivered;
  const successRate = completed ? (success / completed) : 0;
  const avgDurationMs = durationN ? Math.round(totalDuration / durationN) : 0;
  const avgAttempts = counts.total ? (attemptsSum / counts.total) : 0;

  return {
    counts,
    successRate,
    avgDurationMs,
    avgAttempts,
    completed,
  };
}
