import Component from '@glimmer/component';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type AppUpdateService from 'headband/services/app-update';

const VERSION = __APP_VERSION__;

const STATUS_TEXT: Record<string, string> = {
  unavailable: 'Updates only work in the installed or online app.',
  idle: 'Starting up…',
  checking: 'Checking for updates…',
  'saving-offline': 'Saving the game for offline play…',
  downloading: 'Downloading the new version…',
  'up-to-date': 'You have the latest version.',
  ready: 'A new version is ready. Switching now…',
  updating: 'Switching to the new version…',
  error: 'Couldn’t check for updates.',
};

/**
 * The running version, what the updater is doing, and a button to check
 * for a new version now.
 */
export default class AppUpdateSetting extends Component {
  @service declare appUpdate: AppUpdateService;

  version = VERSION;

  get statusText(): string {
    return STATUS_TEXT[this.appUpdate.status] ?? '';
  }

  get isBusy(): boolean {
    return ['checking', 'downloading', 'updating'].includes(
      this.appUpdate.status,
    );
  }

  get canCheck(): boolean {
    return this.appUpdate.status !== 'unavailable' && !this.isBusy;
  }

  check = (): void => {
    void this.appUpdate.checkForUpdate();
  };

  <template>
    <section class="bg-plum-700/60 rounded-2xl p-4" data-test-app-update>
      <h2 class="text-lg font-semibold">App version</h2>
      <p class="mt-1 text-base text-white/80">
        Version
        <span class="font-semibold text-white" data-test-app-update-version>
          {{this.version}}
        </span>
      </p>
      <p
        class="mt-1 text-base text-white/80"
        aria-live="polite"
        data-test-app-update-status
      >
        {{this.statusText}}
        {{#if this.appUpdate.lastError}}
          <span class="block text-sm">({{this.appUpdate.lastError}})</span>
        {{/if}}
      </p>
      <button
        type="button"
        class="mt-3 min-h-12 w-full rounded-xl bg-white/15 px-5 text-lg font-semibold active:bg-white/25 disabled:opacity-40"
        disabled={{if this.canCheck false true}}
        {{on "click" this.check}}
        data-test-check-for-updates
      >
        Check for updates
      </button>
    </section>
  </template>
}
