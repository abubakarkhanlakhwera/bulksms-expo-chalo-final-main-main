// modules/limits.js
export const LIMITS = {
  per15min: 150,
  perHour: 250,
  perDay: 750,
};

export function canSend(history, now = Date.now()) {
  const cutoff15 = now - 15 * 60 * 1000;
  const cutoff1h = now - 60 * 60 * 1000;
  const cutoff1d = now - 24 * 60 * 60 * 1000;

  const count15 = history.filter((t) => t > cutoff15).length;
  const count1h = history.filter((t) => t > cutoff1h).length;
  const count1d = history.filter((t) => t > cutoff1d).length;

  return (
    count15 < LIMITS.per15min &&
    count1h < LIMITS.perHour &&
    count1d < LIMITS.perDay
  );
}
