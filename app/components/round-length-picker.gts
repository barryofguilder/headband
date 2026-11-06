import Component from '@glimmer/component';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type SettingsService from 'headband/services/settings';
import { ROUND_LENGTHS } from 'headband/services/settings';

const stepButtonClass =
  'flex size-16 shrink-0 items-center justify-center rounded-full bg-plum-700 text-4xl font-bold transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100';

/**
 * A large stepper for choosing how long a round lasts. The choice is saved.
 */
export default class RoundLengthPicker extends Component {
  @service declare settings: SettingsService;

  get seconds(): number {
    return this.settings.roundSeconds;
  }

  get shorter(): number | undefined {
    return [...ROUND_LENGTHS].reverse().find((length) => length < this.seconds);
  }

  get longer(): number | undefined {
    return ROUND_LENGTHS.find((length) => length > this.seconds);
  }

  decrease = (): void => {
    if (this.shorter !== undefined) {
      this.settings.setRoundSeconds(this.shorter);
    }
  };

  increase = (): void => {
    if (this.longer !== undefined) {
      this.settings.setRoundSeconds(this.longer);
    }
  };

  <template>
    <section aria-labelledby="round-length-label">
      <h2
        id="round-length-label"
        class="mb-3 text-center text-lg font-semibold"
      >
        Round length
      </h2>
      <div
        class="bg-plum-700/60 flex items-center justify-between gap-4 rounded-3xl p-3"
      >
        <button
          type="button"
          class={{stepButtonClass}}
          disabled={{if this.shorter false true}}
          {{on "click" this.decrease}}
          data-test-round-shorter
        >
          <span aria-hidden="true">−</span>
          <span class="sr-only">Shorter round</span>
        </button>

        <p
          class="flex flex-col items-center"
          aria-live="polite"
          data-test-round-length
        >
          <span class="text-6xl font-bold tabular-nums">{{this.seconds}}</span>
          <span class="text-lg text-white/80">seconds</span>
        </p>

        <button
          type="button"
          class={{stepButtonClass}}
          disabled={{if this.longer false true}}
          {{on "click" this.increase}}
          data-test-round-longer
        >
          <span aria-hidden="true">+</span>
          <span class="sr-only">Longer round</span>
        </button>
      </div>
    </section>
  </template>
}
