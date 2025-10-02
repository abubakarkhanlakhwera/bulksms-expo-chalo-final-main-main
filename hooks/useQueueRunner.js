import { useMemo } from "react";
import {
    pauseQueue,
    setRateQueue,
    startQueue,
    stopQueue,
} from "../modules/queue/runner";

export function useQueueRunner() {
  return useMemo(
    () => ({
      start: startQueue,
      pause: pauseQueue,
      stop: stopQueue,
      setRate: setRateQueue,
    }),
    []
  );
}
