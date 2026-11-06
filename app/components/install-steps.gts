import Component from '@glimmer/component';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import type InstallService from 'headband/services/install';

/**
 * How to add the game to the home screen on this phone: Chrome's own
 * install button on Android, or numbered steps everywhere else.
 */
export default class InstallSteps extends Component {
  @service declare install: InstallService;

  promptInstall = (): void => {
    void this.install.promptInstall();
  };

  <template>
    {{#if this.install.canPromptInstall}}
      <button
        type="button"
        class="bg-teal text-plum-900 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-lg font-semibold active:scale-95"
        {{on "click" this.promptInstall}}
        data-test-install-button
      >
        <span aria-hidden="true">📲</span>
        Install Headband
      </button>
    {{else}}
      <ol class="flex flex-col gap-2" data-test-install-steps>
        {{#each this.install.steps as |step index|}}
          <li class="flex gap-3 text-base">
            <span
              class="bg-teal text-plum-900 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              aria-hidden="true"
            >{{add index 1}}</span>
            <span class="pt-0.5">{{step}}</span>
          </li>
        {{/each}}
      </ol>
    {{/if}}
  </template>
}

function add(a: number, b: number): number {
  return a + b;
}
