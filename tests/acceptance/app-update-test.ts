import { module, test } from 'qunit';
import { click, settled, visit } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'headband/tests/helpers';
import {
  useFakeClock,
  type FakeClock,
} from 'headband/tests/helpers/fake-clock';
import { useFakeDevice } from 'headband/tests/helpers/fake-device';
import { clearAppStorage } from 'headband/tests/helpers/storage';
import { COUNTDOWN_SECONDS } from 'headband/components/play-round';
import type AppUpdateService from 'headband/services/app-update';

module('Acceptance | app update', function (hooks) {
  setupApplicationTest(hooks);

  let clock: FakeClock;
  let applied: number;

  hooks.beforeEach(function () {
    clearAppStorage();
    clock = useFakeClock(this.owner);
    useFakeDevice(this.owner);
    applied = 0;
  });
  hooks.afterEach(function () {
    clearAppStorage();
  });

  /**
   * The service starts at boot, and tests never register a real service
   * worker, so this gives the running service a fake way to apply updates.
   */
  function appUpdate(owner: Owner): AppUpdateService {
    const service = owner.lookup('service:app-update') as AppUpdateService;
    service.applyUpdate = () => {
      applied += 1;
    };
    return service;
  }

  test('an update is applied right away on a safe screen', async function (assert) {
    await visit('/');
    appUpdate(this.owner).updateFound();
    assert.strictEqual(applied, 1);
  });

  test('an update waits until the round and results are over', async function (assert) {
    await visit('/play/animals/round');
    appUpdate(this.owner).updateFound();
    assert.strictEqual(applied, 0, 'not during the round');

    await clock.advance((COUNTDOWN_SECONDS + 60) * 1000);
    await settled();
    assert.dom('[data-test-score]').exists();
    assert.strictEqual(applied, 0, 'not on the results');

    await click('[data-test-home]');
    assert.strictEqual(applied, 1, 'applied once back on Home');
  });

  test('an update waits while a category is being made', async function (assert) {
    await visit('/my-categories/new');
    appUpdate(this.owner).updateFound();
    assert.strictEqual(applied, 0);

    await click('[data-test-back]');
    assert.strictEqual(applied, 1);
  });

  test('an update is only applied once', async function (assert) {
    await visit('/');
    const service = appUpdate(this.owner);
    service.updateFound();
    service.updateFound();
    await click('[data-test-menu="how-to-play"]');
    assert.strictEqual(applied, 1);
  });

  test('tests never register a real service worker', async function (assert) {
    await visit('/');
    const registrations =
      'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistrations()
        : [];
    assert.strictEqual(registrations.length, 0);
  });

  test('Settings shows the version and that updates need the real app', async function (assert) {
    await visit('/settings');
    assert.dom('[data-test-app-update-version]').hasAnyText();
    assert
      .dom('[data-test-app-update-status]')
      .includesText('only work in the installed or online app');
    assert.dom('[data-test-check-for-updates]').isDisabled();
  });

  test('Settings says when a new version is ready', async function (assert) {
    await visit('/play/animals/round');
    appUpdate(this.owner).updateFound();
    await visit('/settings');
    // Leaving the round applied it, so the status moves on.
    assert.strictEqual(applied, 1);
    assert.dom('[data-test-app-update-status]').includesText('new version');
  });
});
