import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeNumbers } from '../utils/phone';
import type { SmsProvider } from './SmsProvider';

export type BulkProgress = {
  total: number;
  sent: number;
  failed: number;
  current?: string;
  done: boolean;
  paused: boolean;
  cancelled: boolean;
};

const STORE_KEY = '@bulk_sms_last_progress';

export class BulkQueue {
  private provider: SmsProvider;
  private concurrency: number;
  private paused = false;
  private cancelled = false;

  constructor(provider: SmsProvider, opts?: { concurrency?: number }) {
    this.provider = provider;
    this.concurrency = Math.max(1, opts?.concurrency ?? 1); // start conservatively
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }
  cancel() { this.cancelled = true; }

  async sendAll(
    rawNumbers: string[] | string,
    message: string,
    onUpdate?: (p: BulkProgress) => void
  ) {
    const numbers = normalizeNumbers(rawNumbers);
    const progress: BulkProgress = {
      total: numbers.length, sent: 0, failed: 0, done: false, paused: false, cancelled: false,
    };

    const queue = numbers.slice();
    onUpdate?.(progress);

    const workers = Array.from({ length: this.concurrency }, () =>
      this.worker(queue, message, progress, onUpdate)
    );

    await Promise.all(workers);
    progress.done = true;
    await this.persist(progress);
    onUpdate?.(progress);
    return progress;
  }

  private async worker(
    queue: string[],
    message: string,
    progress: BulkProgress,
    onUpdate?: (p: BulkProgress) => void
  ) {
    while (queue.length && !this.cancelled) {
      if (this.paused) {
        progress.paused = true;
        onUpdate?.(progress);
        await this.sleep(250);
        continue;
      }
      progress.paused = false;

      const to = queue.shift()!;
      progress.current = to;
      try {
        const res = await this.provider.send(to, message);
        if (res.status === 'sent') progress.sent++;
        else progress.failed++;
      } catch {
        progress.failed++;
      }

      onUpdate?.(progress);

      // Persist every 5 messages
      const done = progress.sent + progress.failed;
      if (done % 5 === 0) await this.persist(progress);
    }

    if (this.cancelled) {
      progress.cancelled = true;
      onUpdate?.(progress);
      await this.persist(progress);
    }
  }

  private async persist(p: BulkProgress) {
    try { await AsyncStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch {}
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
