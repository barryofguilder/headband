import type { TOC } from '@ember/component/template-only';

const VERSION = __APP_VERSION__;

/**
 * Which build is running, so it's easy to tell whether a phone has the
 * latest version.
 */
const AppVersion: TOC<object> = <template>
  <p class="mt-8 text-center text-sm text-white/50" data-test-app-version>
    Version
    {{VERSION}}
  </p>
</template>;

export default AppVersion;
