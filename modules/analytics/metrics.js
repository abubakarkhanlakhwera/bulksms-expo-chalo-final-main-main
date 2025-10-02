// modules/analytics/metrics.jsx
// Lightweight live counters for queue screen (used by ProgressBar later)

import { QStatus } from "../queue/state";

export function computeProgress(items = []) {
  const total = items.length || 0;
  const sentLike = items.filter((i) => i.status === QStatus.SENT || i.status === QStatus.DELIVERED).length;
  const failed = items.filter((i) => i.status === QStatus.FAILED).length;
  const done = sentLike + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, sentLike, failed, pct };
}
