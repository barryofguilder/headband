import { LinkTo } from '@ember/routing';
import { pageTitle } from 'ember-page-title';
import type { TOC } from '@ember/component/template-only';

interface ScreenHeaderSignature {
  Args: {
    title: string;
    /**
     * Route the back button goes to. Defaults to the home screen.
     */
    backTo?: string;
  };
}

const ScreenHeader: TOC<ScreenHeaderSignature> = <template>
  {{pageTitle @title}}
  <header class="relative flex min-h-14 items-center justify-center py-2">
    <LinkTo
      @route={{if @backTo @backTo "index"}}
      class="text-teal absolute left-0 flex min-h-12 items-center gap-1 rounded-xl px-2 text-lg font-medium active:bg-white/10"
      data-test-back
    >
      <span aria-hidden="true">‹</span>
      Back
    </LinkTo>
    <h1 class="text-2xl font-bold tracking-tight">{{@title}}</h1>
  </header>
</template>;

export default ScreenHeader;
