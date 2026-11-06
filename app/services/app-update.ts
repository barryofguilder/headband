import Service, { service } from '@ember/service';
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
 * Keeps the installed app on the latest version. It checks for updates when
 * the app opens, when it comes back from the background, and every hour.
 * When one is ready, it switches to it right away, or as soon as the player
 * leaves a screen where a reload would lose something.
 */
export default class AppUpdateService extends Service {
  @service declare router: RouterService;

  isUpdateReady = false;

  /**
   * Switches to the new version and reloads. Set once the service worker is
   * registered.
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

    void import('virtual:pwa-register').then(({ registerSW }) => {
      const updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh: () => this.updateFound(),
        onRegisteredSW: (_url, registration) => {
          this.#registration = registration;
          this.#checkTimer = window.setInterval(
            () => this.checkForUpdate(),
            CHECK_EVERY_MS,
          );
        },
      });
      this.applyUpdate = () => {
        void updateServiceWorker(true);
      };
      this.#tryToApply();
    });
  }

  /**
   * Called when a new version has downloaded and is waiting.
   */
  updateFound(): void {
    this.isUpdateReady = true;
    this.#tryToApply();
  }

  checkForUpdate(): void {
    this.#registration?.update().catch(() => {
      // Offline, probably. Try again next time.
    });
  }

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

  #onVisibilityChange = (): void => {
    // Coming back to the app doesn't reload it, so check for updates here.
    if (document.visibilityState === 'visible') {
      this.checkForUpdate();
    }
  };
}
