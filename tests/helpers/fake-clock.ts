import { settled } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import ClockService from 'headband/services/clock';

/**
 * A clock that only moves when a test calls `advance`.
 */
export class FakeClock extends ClockService {
  time = 1_000_000;
  timers = new Set<{ ms: number; next: number; callback: () => void }>();

  now(): number {
    return this.time;
  }

  every(ms: number, callback: () => void): () => void {
    const timer = { ms, next: this.time + ms, callback };
    this.timers.add(timer);
    return () => this.timers.delete(timer);
  }

  /**
   * Moves time forward, firing timers along the way, then waits for the app to settle.
   */
  async advance(ms: number): Promise<void> {
    const end = this.time + ms;
    for (;;) {
      const due = [...this.timers].filter((timer) => timer.next <= end);
      if (due.length === 0) {
        break;
      }
      const next = Math.min(...due.map((timer) => timer.next));
      this.time = next;
      for (const timer of due) {
        if (timer.next === next && this.timers.has(timer)) {
          timer.next += timer.ms;
          timer.callback();
        }
      }
    }
    this.time = end;
    await settled();
  }
}

/**
 * Swaps in the fake clock. Call before `visit`.
 */
export function useFakeClock(owner: Owner): FakeClock {
  owner.register('service:clock', FakeClock);
  return owner.lookup('service:clock') as FakeClock;
}
