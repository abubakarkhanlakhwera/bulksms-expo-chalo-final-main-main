// modules/queue/scheduler.jsx
// Simple rate-based scheduler: emits "tick" at an interval derived from rate/min.
// start(rate, onTick) -> controller with pause(), resume(), stop().

function calcIntervalMs(ratePerMin) {
  const r = Math.max(1, Number(ratePerMin) || 1);
  // spread evenly across the minute
  return Math.max(200, Math.floor(60_000 / r));
}

export function createScheduler({ ratePerMin, onTick }) {
  let interval = calcIntervalMs(ratePerMin);
  let tid = null;
  let paused = true;

  const tick = () => {
    try {
      onTick?.();
    } catch (_e) {
      // tick error suppressed to avoid noisy logs in production
    }
  };

  function loop() {
    tid = setTimeout(() => {
      if (!paused) {
        tick();
        loop();
      }
    }, interval);
  }

  return {
    start() {
      if (!paused) return;
      paused = false;
      loop();
    },
    pause() {
      paused = true;
      if (tid) { clearTimeout(tid); tid = null; }
    },
    stop() {
      paused = true;
      if (tid) { clearTimeout(tid); tid = null; }
    },
    setRate(nextRatePerMin) {
      interval = calcIntervalMs(nextRatePerMin);
    },
    isPaused() { return paused; },
    getInterval() { return interval; },
  };
}
