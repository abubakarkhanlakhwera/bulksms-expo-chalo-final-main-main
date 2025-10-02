import {
  makeQueueItem, markSending, markSent, markDelivered, markFailed, markCanceled,
  QStatus
} from "../../modules/queue/state";

describe("queue state transitions", () => {
  it("transitions correctly", () => {
    let it = makeQueueItem({ name: "Ali", phoneNormalized: "+923001112222", message: "Hi" });
    expect(it.status).toBe(QStatus.QUEUED);

    it = markSending(it);
    expect(it.status).toBe(QStatus.SENDING);
    expect(it.attempts).toBe(1);

    it = markSent(it, "id-1");
    expect(it.status).toBe(QStatus.SENT);
    expect(it.messageId).toBe("id-1");

    it = markDelivered(it);
    expect(it.status).toBe(QStatus.DELIVERED);

    it = markFailed(it, "x");
    expect(it.status).toBe(QStatus.FAILED);
    expect(it.lastError).toBe("x");

    it = markCanceled(it);
    expect(it.status).toBe(QStatus.CANCELED);
  });
});
