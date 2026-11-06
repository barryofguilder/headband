import Component from '@glimmer/component';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type SettingsService from 'headband/services/settings';

/**
 * A switch for whether tapping the screen answers during a round.
 */
export default class TapToAnswerSetting extends Component {
  @service declare settings: SettingsService;

  toggle = (): void => {
    this.settings.setTapToAnswer(!this.settings.tapToAnswer);
  };

  <template>
    <section class="bg-plum-700/60 rounded-2xl p-4">
      <div class="flex items-center justify-between gap-4">
        <h2 id="tap-to-answer-label" class="text-lg font-semibold">
          Tap to answer
        </h2>
        <button
          type="button"
          role="switch"
          aria-checked={{if this.settings.tapToAnswer "true" "false"}}
          aria-labelledby="tap-to-answer-label"
          aria-describedby="tap-to-answer-help"
          class="relative flex h-10 w-18 shrink-0 items-center rounded-full border-2 px-1 transition-colors
            {{if
              this.settings.tapToAnswer
              'bg-teal border-teal'
              'border-white/40 bg-white/10'
            }}"
          {{on "click" this.toggle}}
          data-test-tap-to-answer
        >
          <span
            class="size-7 rounded-full shadow transition-transform motion-reduce:transition-none
              {{if
                this.settings.tapToAnswer
                'bg-plum-900 translate-x-8'
                'bg-white'
              }}"
          ></span>
          <span class="sr-only">{{if
              this.settings.tapToAnswer
              "On"
              "Off"
            }}</span>
        </button>
      </div>
      <p class="mt-2 text-base text-white/80" data-test-tap-to-answer-status>
        <span class="font-semibold text-white">
          {{if this.settings.tapToAnswer "On." "Off."}}
        </span>
        <span id="tap-to-answer-help">
          {{#if this.settings.tapToAnswer}}
            Tap the top of the screen to pass, and the bottom when you get it,
            as well as tilting.
          {{else}}
            Only tilting answers, so bumping the screen won’t count. If tilt
            isn’t working on a phone, tapping turns on by itself.
          {{/if}}
        </span>
      </p>
    </section>
  </template>
}
