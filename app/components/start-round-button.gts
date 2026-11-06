import Component from '@glimmer/component';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type RouterService from '@ember/routing/router-service';
import type { Category } from 'headband/categories';
import type TiltService from 'headband/services/tilt';

interface StartRoundButtonSignature {
  Args: {
    category: Category;
  };
}

/**
 * Starts a round. On iPhone, the first tap also shows the motion permission
 * prompt, which Safari only allows from a tap.
 */
export default class StartRoundButton extends Component<StartRoundButtonSignature> {
  @service declare tilt: TiltService;
  @service declare router: RouterService;

  get isTiltOff(): boolean {
    return this.tilt.access === 'denied';
  }

  start = async (): Promise<void> => {
    // This has to run before anything else is awaited, or Safari ignores it.
    await this.tilt.requestAccess();
    void this.router.transitionTo('play.round', this.args.category.id);
  };

  <template>
    {{#if this.isTiltOff}}
      <p
        class="border-teal/50 rounded-2xl border p-4 text-lg text-white/90"
        data-test-tilt-off
      >
        <span class="text-teal font-semibold">Tilt is off.</span>
        Tap the bottom half of the screen when you get it, and the top half to
        pass.
      </p>
    {{/if}}

    <button
      type="button"
      class="bg-teal text-plum-900 mt-auto flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-6 text-xl font-semibold transition-transform active:scale-95"
      {{on "click" this.start}}
      data-test-start
    >
      <span aria-hidden="true">▶</span>
      Start
    </button>
  </template>
}
