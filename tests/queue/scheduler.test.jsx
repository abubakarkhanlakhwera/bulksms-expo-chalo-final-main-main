import { createScheduler } from "../../modules/queue/scheduler";

describe("rate scheduler", () => {
  it("ticks at derived interval and can pause/stop", async () => {
    let ticks = 0;
    const sch = createScheduler({ ratePerMin: 60, onTick: () => { ticks++; }});
    sch.start();
    await new Promise(r => setTimeout(r, 230)); // should tick ~ every 1s at 60/min? (we clamp min 200ms)
    sch.pause();
    const pausedTicks = ticks;
    await new Promise(r => setTimeout(r, 300));
    expect(ticks).toBe(pausedTicks);
    sch.stop();
  });

  it("updates interval on setRate", () => {
    const sch = createScheduler({ ratePerMin: 20, onTick: () => {} });
    const i1 = sch.getInterval();
    sch.setRate(40);
    const i2 = sch.getInterval();
    expect(i2).toBeLessThan(i1);
    sch.stop();
  });
});
