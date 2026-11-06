/**
 * Small wrappers around localStorage. Storage can be unavailable (private
 * browsing, blocked site data), so every call fails quietly.
 */
const PREFIX = 'headband:';

export function readJSON<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore. The game still works, it just won't remember.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore.
  }
}
