/**
 * Removes everything the app saved, so each test starts fresh.
 */
export function clearAppStorage(): void {
  for (const key of Object.keys(window.localStorage)) {
    if (key.startsWith('headband:')) {
      window.localStorage.removeItem(key);
    }
  }
}
