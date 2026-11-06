import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Owner from '@ember/owner';
import {
  detectPlatform,
  isRunningInstalled,
  safariVersion,
  type InstallPlatform,
} from 'headband/utils/install';
import {
  ANDROID_STEPS,
  IOS_CHROME_STEPS,
  IOS_OPEN_IN_SAFARI_STEPS,
  iosSafariSteps,
} from 'headband/utils/install-steps';
import { readJSON, writeJSON } from 'headband/utils/storage';

/**
 * Chrome's install prompt event. It isn't in TypeScript's built-in types.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'install-banner-dismissed';

/**
 * Knows whether the game is installed to the home screen, and how to help
 * the player install it if not.
 */
export default class InstallService extends Service {
  @tracked isInstalled = isRunningInstalled();
  @tracked isDismissed = readJSON<boolean>(DISMISSED_KEY) === true;
  @tracked installPrompt?: BeforeInstallPromptEvent;

  platform: InstallPlatform = detectPlatform(
    navigator.userAgent,
    navigator.maxTouchPoints,
  );
  safariVersion = safariVersion(navigator.userAgent);

  constructor(owner: Owner) {
    super(owner);
    window.addEventListener('beforeinstallprompt', this.#onInstallPrompt);
    window.addEventListener('appinstalled', this.#onInstalled);
  }

  willDestroy(): void {
    super.willDestroy();
    window.removeEventListener('beforeinstallprompt', this.#onInstallPrompt);
    window.removeEventListener('appinstalled', this.#onInstalled);
  }

  /**
   * Install help is only for phones and tablets running in a browser.
   */
  get canHelpInstall(): boolean {
    return !this.isInstalled && this.platform !== 'desktop';
  }

  get shouldShowBanner(): boolean {
    return this.canHelpInstall && !this.isDismissed;
  }

  /**
   * True when the browser offers its own install button (Android Chrome).
   */
  get canPromptInstall(): boolean {
    // iPhones never offer this, so stick to the written steps there even if
    // something pretends to.
    return this.installPrompt !== undefined && !this.platform.startsWith('ios');
  }

  get steps(): string[] {
    switch (this.platform) {
      case 'ios-safari':
        return iosSafariSteps(this.safariVersion);
      case 'ios-chrome':
        return IOS_CHROME_STEPS;
      case 'ios-in-app':
      case 'ios-other':
        return IOS_OPEN_IN_SAFARI_STEPS;
      default:
        return ANDROID_STEPS;
    }
  }

  async promptInstall(): Promise<void> {
    const installPrompt = this.installPrompt;
    if (!installPrompt) {
      return;
    }
    this.installPrompt = undefined;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      this.isInstalled = true;
    }
  }

  dismissBanner(): void {
    this.isDismissed = true;
    writeJSON(DISMISSED_KEY, true);
  }

  #onInstallPrompt = (event: Event): void => {
    // Keep Chrome's mini bar from popping up, and show our button instead.
    event.preventDefault();
    this.installPrompt = event as BeforeInstallPromptEvent;
  };

  #onInstalled = (): void => {
    this.isInstalled = true;
    this.installPrompt = undefined;
  };
}
