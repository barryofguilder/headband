import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'headband/tests/helpers';
import { clearAppStorage } from 'headband/tests/helpers/storage';
import type InstallService from 'headband/services/install';
import type { InstallPlatform } from 'headband/utils/install';

/**
 * Lets each test pick the phone and browser. The install service starts at
 * boot (see app/instance-initializers/install.ts), before a test could
 * register a fake, so this adjusts the running service instead.
 */
function fakeInstall(
  owner: Owner,
  options: {
    platform: InstallPlatform;
    safariVersion?: number;
    isInstalled?: boolean;
    canPrompt?: boolean;
  },
): { prompted: () => boolean } {
  let prompted = false;
  const install = owner.lookup('service:install') as InstallService;
  install.platform = options.platform;
  install.safariVersion = options.safariVersion;
  install.isInstalled = options.isInstalled ?? false;
  install.isDismissed = false;
  if (options.canPrompt) {
    install.installPrompt = {
      prompt: () => {
        prompted = true;
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    } as unknown as InstallService['installPrompt'];
  }
  return { prompted: () => prompted };
}

module('Acceptance | install banner', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    clearAppStorage();
  });
  hooks.afterEach(function () {
    clearAppStorage();
  });

  test('iPhone Safari shows the steps for its version', async function (assert) {
    fakeInstall(this.owner, { platform: 'ios-safari', safariVersion: 27 });
    await visit('/');
    assert
      .dom('[data-test-install-banner]')
      .includesText('Play it like an app');
    assert.dom('[data-test-install-steps]').doesNotExist();

    await click('[data-test-show-install-steps]');
    assert.dom('[data-test-install-steps] li').exists({ count: 5 });
    assert.dom('[data-test-install-steps]').includesText('View More');
  });

  test('in-app browsers are told to open Safari', async function (assert) {
    fakeInstall(this.owner, { platform: 'ios-in-app' });
    await visit('/');
    await click('[data-test-show-install-steps]');
    assert
      .dom('[data-test-install-steps]')
      .includesText('Open this page in Safari');
  });

  test('Android with an install prompt gets an Install button', async function (assert) {
    const install = fakeInstall(this.owner, {
      platform: 'android',
      canPrompt: true,
    });
    await visit('/');
    await click('[data-test-install-button]');
    assert.true(install.prompted());
    assert
      .dom('[data-test-install-banner]')
      .doesNotExist('gone once installed');
  });

  test('dismissing hides it for good, but How to play still has the steps', async function (assert) {
    fakeInstall(this.owner, { platform: 'ios-safari', safariVersion: 26 });
    await visit('/');
    await click('[data-test-dismiss-install]');
    assert.dom('[data-test-install-banner]').doesNotExist();
    assert.strictEqual(
      window.localStorage.getItem('headband:install-banner-dismissed'),
      'true',
    );

    await visit('/how-to-play');
    assert
      .dom('[data-test-install-help]')
      .includesText('Add it to your home screen');
    assert.dom('[data-test-install-steps]').includesText('•••');
  });

  test('not shown when already installed', async function (assert) {
    fakeInstall(this.owner, { platform: 'ios-safari', isInstalled: true });
    await visit('/');
    assert.dom('[data-test-install-banner]').doesNotExist();
    await visit('/how-to-play');
    assert.dom('[data-test-install-help]').doesNotExist();
  });

  test('not shown on a computer', async function (assert) {
    fakeInstall(this.owner, { platform: 'desktop' });
    await visit('/');
    assert.dom('[data-test-install-banner]').doesNotExist();
  });
});
