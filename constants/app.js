// constants/app.jsx
// Defaults & caps used by queue/rate control
export const DEFAULT_RATE_PER_MIN = 5;     // msgs/min
export const MIN_RATE_PER_MIN = 5;
export const MAX_RATE_PER_MIN = 60;

export const MAX_RETRIES = 2;               // simulated retries for transient errors
export const SEND_TIMEOUT_MS = 12_000;      // simulated single-send timeout
export const RETRY_BACKOFF_MS = 3_000;      // base backoff before retry
export const JITTER_MS = 800;               // random +/- jitter per send to avoid bursts
