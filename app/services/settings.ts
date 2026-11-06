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
  tapToAnswer?: unknown;
}

/**
 * Game settings, saved on the device.
 */
export default class SettingsService extends Service {
  @tracked roundSeconds: number = loadRoundSeconds();

  /**
   * Whether tapping the top or bottom of the screen answers during a round.
   * Off by default, so a bump doesn't count while tilting. Tapping still
   * works when tilt can't (see PlayRound.tapsWork).
   */
  @tracked tapToAnswer: boolean = readStored()?.tapToAnswer === true;

  setRoundSeconds(seconds: number): void {
    this.roundSeconds = seconds;
    this.#save();
  }

  setTapToAnswer(enabled: boolean): void {
    this.tapToAnswer = enabled;
    this.#save();
  }

  #save(): void {
    writeJSON('settings', {
      roundSeconds: this.roundSeconds,
      tapToAnswer: this.tapToAnswer,
    });
  }
}

function readStored(): StoredSettings | undefined {
  return readJSON<StoredSettings>('settings');
}

function loadRoundSeconds(): number {
  const stored = readStored()?.roundSeconds;
  const valid =
    typeof stored === 'number' &&
    (ROUND_LENGTHS.includes(stored) ||
      (Number.isInteger(stored) && stored >= 10 && stored <= 600));
  return valid ? stored : DEFAULT_ROUND_SECONDS;
}
