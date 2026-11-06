import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { readJSON, writeJSON } from 'headband/utils/storage';

/**
 * Round lengths the player can choose from, in seconds. The dev server adds a
 * 5 second round for quick testing. It never appears in a real build.
 */
export const ROUND_LENGTHS: readonly number[] = [
  ...(__DEV_SERVER__ ? [5] : []),
  30,
  45,
  60,
  90,
  120,
];

export const DEFAULT_ROUND_SECONDS = 60;

interface StoredSettings {
  roundSeconds?: unknown;
}

/**
 * Game settings, saved on the device.
 */
export default class SettingsService extends Service {
  @tracked roundSeconds: number = loadRoundSeconds();

  setRoundSeconds(seconds: number): void {
    this.roundSeconds = seconds;
    writeJSON('settings', { roundSeconds: seconds });
  }
}

function loadRoundSeconds(): number {
  const stored = readJSON<StoredSettings>('settings')?.roundSeconds;
  const valid =
    typeof stored === 'number' &&
    (ROUND_LENGTHS.includes(stored) ||
      (Number.isInteger(stored) && stored >= 10 && stored <= 600));
  return valid ? stored : DEFAULT_ROUND_SECONDS;
}
