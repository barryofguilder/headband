import Service from '@ember/service';

/**
 * The current time and a repeating timer. Tests swap this out so they can
 * move time forward instead of waiting.
 */
export default class ClockService extends Service {
  now(): number {
    return Date.now();
  }

  /**
   * Calls `callback` every `ms` milliseconds. Returns a function that stops it.
   */
  every(ms: number, callback: () => void): () => void {
    const id = window.setInterval(callback, ms);
    return () => window.clearInterval(id);
  }
}
