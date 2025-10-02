import { computeValidationKPIs, computeQueueKPIs } from "../../modules/analytics/reporting";
import { QStatus } from "../../modules/queue/state";

describe("analytics KPIs", () => {
  it("summarizes validation", () => {
    const v = [
      { valid: true, parts: 1, encoding: "GSM-7" },
      { valid: true, parts: 2, encoding: "UCS-2" },
      { valid: false },
    ];
    const k = computeValidationKPIs(v);
    expect(k.total).toBe(3);
    expect(k.valid).toBe(2);
    expect(k.invalid).toBe(1);
    expect(k.partsTotal).toBe(3);
    expect(k.encMix.gsm7 + k.encMix.ucs2).toBe(2);
  });

  it("summarizes queue", () => {
    const items = [
      { status: QStatus.SENT, attempts: 1, durationMs: 100 },
      { status: QStatus.DELIVERED, attempts: 1, durationMs: 200 },
      { status: QStatus.FAILED, attempts: 2, durationMs: 150 },
    ];
    const q = computeQueueKPIs(items);
    expect(q.counts.sent).toBe(1);
    expect(q.counts.delivered).toBe(1);
    expect(q.counts.failed).toBe(1);
    expect(q.completed).toBe(3);
    expect(q.successRate).toBeGreaterThan(0);
    expect(q.avgDurationMs).toBeGreaterThan(0);
    expect(q.avgAttempts).toBeGreaterThan(0);
  });
});
