import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Owner from '@ember/owner';
import type RouterService from '@ember/routing/router-service';

/**
 * Screens where reloading would lose something: the round in progress, the
 * results (only kept in memory), and a category being made or edited. An
 * update waits until the player leaves them.
 */
export const UNSAFE_ROUTES = new Set([
  'play.round',
  'play.results',
  'my-categories.new',
  'my-categories.edit',
]);

/**
 * How often to check for a new version while the app stays open.
 */
const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * How long to wait for the new version to take over before reloading
 * anyway.
 */
const RELOAD_FALLBACK_MS = 4000;

export type UpdateStatus =
  | 'unavailable'
  | 'idle'
  | 'checking'
  | 'saving-offline'
  | 'downloading'
  | 'up-to-date'
  | 'ready'
  | 'updating'
  | 'error';

/**
 * Keeps the installed app on the latest version. It checks for updates when
 * the app opens, when it comes back from the background, and every hour.
 * When one is ready, it switches to it right away, or as soon as the player
 * leaves a screen where a reload would lose something.
 *
 * It watches the service worker registration directly, rather than relying
 * on workbox-window's events, which didn't switch versions on iPhone while
 * the app was open.
 */
export default class AppUpdateService extends Service {
  @service declare router: RouterService;

  @tracked status: UpdateStatus = 'unavailable';
  @tracked lastError?: string;

  isUpdateReady = false;

  /**
   * Switches to the new version and reloads. Set once the service worker is
   * registered. Tests replace it.
   */
  applyUpdate?: () => void;

  #registration?: ServiceWorkerRegistration;
  #isApplying = false;
  #checkTimer?: number;

  constructor(owner: Owner) {
    super(owner);
    this.router.on('routeDidChange', this.#tryToApply);
    document.addEventListener('visibilitychange', this.#onVisibilityChange);
  }

  willDestroy(): void {
    super.willDestroy();
    this.router.off('routeDidChange', this.#tryToApply);
    document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    window.clearInterval(this.#checkTimer);
  }

  /**
   * Registers the service worker. Production builds only: in development a
   * stored copy would hide your changes, and tests shouldn't install one.
   */
  start(): void {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      return;
    }
    this.status = 'idle';

    void import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh: () => this.updateFound(),
        onRegisteredSW: (_url, registration) => {
          if (registration) {
            this.#watch(registration);
          }
        },
        onRegisterError: (error: unknown) => {
          this.#failed(error);
        },
      });
      this.applyUpdate = this.#switchToWaitingVersion;
      this.#tryToApply();
    });
  }

  /**
   * Called when a new version has downloaded and is waiting.
   */
  updateFound(): void {
    this.isUpdateReady = true;
    if (this.status !== 'updating') {
      this.status = 'ready';
    }
    this.#tryToApply();
  }

  async checkForUpdate(): Promise<void> {
    const registration = this.#registration;
    if (!registration) {
      return;
    }
    if (this.isUpdateReady) {
      this.#tryToApply();
      return;
    }

    this.status = 'checking';
    try {
      await registration.update();
    } catch (error) {
      this.#failed(error);
      return;
    }

    if (registration.waiting) {
      this.updateFound();
    } else if (registration.installing) {
      this.status = 'downloading';
    } else {
      this.status = 'up-to-date';
    }
  }

  #watch(registration: ServiceWorkerRegistration): void {
    this.#registration = registration;
    this.#checkTimer = window.setInterval(
      () => void this.checkForUpdate(),
      CHECK_EVERY_MS,
    );

    // A new version may already be waiting from an earlier visit.
    if (registration.waiting && navigator.serviceWorker.controller) {
      this.updateFound();
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) {
        return;
      }
      // With no controller yet, this is the first visit saving the game for
      // offline play, not an update.
      const isUpdate = Boolean(navigator.serviceWorker.controller);
      this.status = isUpdate ? 'downloading' : 'saving-offline';
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') {
          if (isUpdate) {
            this.updateFound();
          } else {
            this.status = 'up-to-date';
          }
        }
        // "redundant" usually means an even newer version replaced this one
        // mid-install, which is normal. That one reports its own progress.
      });
    });

    if (this.status === 'idle') {
      this.status = 'up-to-date';
    }
  }

  /**
   * Tells the waiting version to take over, then reloads once it has. If it
   * doesn't take over in a few seconds, reloads anyway.
   */
  #switchToWaitingVersion = (): void => {
    this.status = 'updating';
    let reloaded = false;
    const reload = () => {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', reload, {
      once: true,
    });
    this.#registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.setTimeout(reload, RELOAD_FALLBACK_MS);
  };

  #tryToApply = (): void => {
    if (!this.isUpdateReady || this.#isApplying || !this.applyUpdate) {
      return;
    }
    if (UNSAFE_ROUTES.has(this.router.currentRouteName ?? '')) {
      return;
    }
    this.#isApplying = true;
    this.applyUpdate();
  };

  #failed(error: unknown): void {
    this.status = 'error';
    this.lastError = error instanceof Error ? error.message : String(error);
  }

  #onVisibilityChange = (): void => {
    // Coming back to the app doesn't reload it, so check for updates here.
    if (document.visibilityState === 'visible') {
      void this.checkForUpdate();
    }
  };
}
