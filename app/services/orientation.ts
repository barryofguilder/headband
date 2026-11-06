import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Owner from '@ember/owner';

interface LockableScreenOrientation {
  lock?: (orientation: 'landscape') => Promise<void>;
  unlock?: () => void;
}

/**
 * Tracks whether the phone is sideways.
 */
export default class OrientationService extends Service {
  @tracked isLandscape: boolean;

  #query = window.matchMedia('(orientation: landscape)');

  constructor(owner: Owner) {
    super(owner);
    this.isLandscape = this.#query.matches;
    this.#query.addEventListener('change', this.#update);
  }

  willDestroy(): void {
    super.willDestroy();
    this.#query.removeEventListener('change', this.#update);
  }

  /**
   * Tries to keep the screen sideways. This works on Android when the app is
   * installed to the home screen. iPhone doesn't allow it, so the round asks
   * the player to turn the phone instead.
   */
  lockLandscape(): void {
    const orientation = screen.orientation as
      LockableScreenOrientation | undefined;
    orientation?.lock?.('landscape').catch(() => {
      // Not supported here. That's fine.
    });
  }

  unlock(): void {
    const orientation = screen.orientation as
      LockableScreenOrientation | undefined;
    try {
      orientation?.unlock?.();
    } catch {
      // Not supported here. That's fine.
    }
  }

  #update = (): void => {
    this.isLandscape = this.#query.matches;
  };
}
