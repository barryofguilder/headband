import { module, test } from 'qunit';
import { click, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'headband/tests/helpers';
import {
  useFakeClock,
  type FakeClock,
} from 'headband/tests/helpers/fake-clock';
import {
  useFakeDevice,
  type FakeTilt,
} from 'headband/tests/helpers/fake-device';
import { clearAppStorage } from 'headband/tests/helpers/storage';
import { COUNTDOWN_SECONDS } from 'headband/components/play-round';

module('Acceptance | settings', function (hooks) {
  setupApplicationTest(hooks);

  let clock: FakeClock;
  let tilt: FakeTilt;

  hooks.beforeEach(function () {
    clearAppStorage();
    clock = useFakeClock(this.owner);
    ({ tilt } = useFakeDevice(this.owner));
  });
  hooks.afterEach(function () {
    clearAppStorage();
  });

  async function startRound(): Promise<void> {
    await visit('/play/animals/round');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
  }

  test('Settings defaults to 60 seconds and Tap to answer off', async function (assert) {
    await visit('/settings');
    assert.dom('[data-test-round-length]').hasText('60 seconds');
    assert.dom('[data-test-tap-to-answer]').hasAria('checked', 'false');
    assert.dom('[data-test-tap-to-answer-status]').includesText('Off.');
  });

  test('turning Tap to answer on is saved', async function (assert) {
    await visit('/settings');
    await click('[data-test-tap-to-answer]');
    assert.dom('[data-test-tap-to-answer]').hasAria('checked', 'true');
    assert.dom('[data-test-tap-to-answer-status]').includesText('On.');
    assert.true(
      window.localStorage
        .getItem('headband:settings')!
        .includes('"tapToAnswer":true'),
    );
  });

  test('with taps on, tapping answers even when tilt works', async function (assert) {
    tilt.hasReadings = true;
    await visit('/settings');
    await click('[data-test-tap-to-answer]');

    await startRound();
    await click('[data-test-correct]');
    assert.dom('[data-test-feedback="correct"]').exists();
  });

  test('with taps off, touching the screen does nothing but tilting still answers', async function (assert) {
    tilt.hasReadings = true;
    await startRound();
    assert.dom('[data-test-taps-off]').exists();
    assert.dom('button[data-test-correct]').doesNotExist();
    await click('[data-test-correct]');
    await click('[data-test-pass]');
    assert.dom('[data-test-feedback]').doesNotExist('taps are ignored');

    await tilt.tiltPhone('down');
    assert.dom('[data-test-feedback="correct"]').exists('tilt still works');
  });

  test('with taps off, tapping still works if motion access was refused', async function (assert) {
    tilt.hasReadings = true;
    tilt.access = 'denied';

    await startRound();
    await click('[data-test-correct]');
    assert.dom('[data-test-feedback="correct"]').exists();
  });

  test('with taps off, tapping still works if the phone sends no tilt readings', async function (assert) {
    await startRound();
    await click('[data-test-pass]');
    assert.dom('[data-test-feedback="pass"]').exists();
  });
});
