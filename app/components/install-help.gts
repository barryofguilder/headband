import Component from '@glimmer/component';
import { service } from '@ember/service';
import InstallSteps from 'headband/components/install-steps';
import type InstallService from 'headband/services/install';

/**
 * The install steps on How to play, so they're still easy to find after
 * the Home banner is dismissed. Hidden once installed and on computers.
 */
export default class InstallHelp extends Component {
  @service declare install: InstallService;

  <template>
    {{#if this.install.canHelpInstall}}
      <section
        class="border-teal/40 mt-6 rounded-2xl border p-4"
        aria-labelledby="install-help-title"
        data-test-install-help
      >
        <h2
          id="install-help-title"
          class="text-teal mb-3 text-lg font-semibold"
        >
          Add it to your home screen
        </h2>
        <InstallSteps />
      </section>
    {{/if}}
  </template>
}
