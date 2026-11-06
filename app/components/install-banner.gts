import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import InstallSteps from 'headband/components/install-steps';
import type InstallService from 'headband/services/install';

/**
 * Suggests adding the game to the home screen, for players using it in a
 * browser on a phone. Hidden once installed or dismissed.
 */
export default class InstallBanner extends Component {
  @service declare install: InstallService;

  @tracked isShowingSteps = false;

  showSteps = (): void => {
    this.isShowingSteps = true;
  };

  dismiss = (): void => {
    this.install.dismissBanner();
  };

  <template>
    {{#if this.install.shouldShowBanner}}
      <aside
        class="bg-plum-700/70 border-teal/40 relative w-full rounded-2xl border p-4 pr-14"
        aria-labelledby="install-banner-title"
        data-test-install-banner
      >
        <button
          type="button"
          class="absolute top-1 right-1 flex size-12 items-center justify-center rounded-full text-xl text-white/70 active:bg-white/10"
          aria-label="Hide this tip"
          {{on "click" this.dismiss}}
          data-test-dismiss-install
        >
          <span aria-hidden="true">✕</span>
        </button>

        <h2 id="install-banner-title" class="text-lg font-semibold">
          <span aria-hidden="true">📲</span>
          Play it like an app
        </h2>
        <p class="mt-1 text-base text-white/85">
          Add Headband to your home screen. It opens full screen and works
          without internet.
        </p>

        <div class="mt-3">
          {{#if (or this.install.canPromptInstall this.isShowingSteps)}}
            <InstallSteps />
          {{else}}
            <button
              type="button"
              class="bg-teal text-plum-900 min-h-12 rounded-xl px-5 text-lg font-semibold active:scale-95"
              {{on "click" this.showSteps}}
              data-test-show-install-steps
            >
              Show me how
            </button>
          {{/if}}
        </div>
      </aside>
    {{/if}}
  </template>
}

function or(a: unknown, b: unknown): boolean {
  return Boolean(a) || Boolean(b);
}
