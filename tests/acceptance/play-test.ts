import { module, test } from 'qunit';
import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'headband/tests/helpers';
import {
  useFakeClock,
  type FakeClock,
} from 'headband/tests/helpers/fake-clock';
import { clearAppStorage } from 'headband/tests/helpers/storage';
import {
  useFakeDevice,
  type FakeOrientation,
  type FakeTilt,
} from 'headband/tests/helpers/fake-device';
import { COUNTDOWN_SECONDS, FEEDBACK_MS } from 'headband/components/play-round';
import type GameService from 'headband/services/game';

module('Acceptance | play', function (hooks) {
  setupApplicationTest(hooks);

  let clock: FakeClock;
  let tilt: FakeTilt;
  let orientation: FakeOrientation;

  hooks.beforeEach(function () {
    clearAppStorage();
    clock = useFakeClock(this.owner);
    ({ tilt, orientation } = useFakeDevice(this.owner));
  });
  hooks.afterEach(function () {
    clearAppStorage();
  });

  function wordOnScreen(): string {
    return document.querySelector('[data-test-word]')!.textContent.trim();
  }

  test('picking a category opens Get ready with the default 60 seconds', async function (assert) {
    await visit('/play');
    assert.dom('[data-test-category="animals"]').exists();
    assert.dom('[data-test-category="sports"]').exists();

    await click('[data-test-category="animals"]');
    assert.strictEqual(currentURL(), '/play/animals');
    assert.dom('[data-test-ready-category]').hasText('Animals');
    assert.dom('[data-test-round-length]').hasText('60 seconds');
  });

  test('the round length choice is remembered', async function (assert) {
    await visit('/play/animals');
    await click('[data-test-round-shorter]');
    assert.dom('[data-test-round-length]').hasText('45 seconds');
    await visit('/play/sports');
    assert.dom('[data-test-round-length]').hasText('45 seconds');
  });

  test('the round length steps between 30 and 120 seconds', async function (assert) {
    await visit('/play/animals');

    await click('[data-test-round-shorter]');
    await click('[data-test-round-shorter]');
    assert.dom('[data-test-round-length]').hasText('30 seconds');
    assert.dom('[data-test-round-shorter]').isDisabled();

    for (const expected of ['45', '60', '90', '120']) {
      await click('[data-test-round-longer]');
      assert.dom('[data-test-round-length]').hasText(`${expected} seconds`);
    }
    assert.dom('[data-test-round-longer]').isDisabled();
    assert.dom('[data-test-round-shorter]').isEnabled();
  });

  test('a full round, from countdown to results', async function (assert) {
    await visit('/play/animals');
    await click('[data-test-round-shorter]');
    await click('[data-test-round-shorter]');
    await click('[data-test-start]');

    assert.dom('[data-test-countdown]').hasText('3');
    assert.dom('[data-test-word]').doesNotExist();
    await clock.advance(1000);
    assert.dom('[data-test-countdown]').hasText('2');

    await clock.advance((COUNTDOWN_SECONDS - 1) * 1000);
    assert.dom('[data-test-countdown]').doesNotExist();
    assert.dom('[data-test-timer]').includesText('0:30');
    const first = wordOnScreen();

    await click('[data-test-correct]');
    assert.dom('[data-test-feedback="correct"]').hasText(/Correct!/);
    assert.dom('[data-test-word]').doesNotExist();

    // Taps during the feedback are ignored.
    await click('[data-test-pass]');
    await clock.advance(FEEDBACK_MS);
    const second = wordOnScreen();
    assert.notStrictEqual(second, first, 'a new word comes up');

    await click('[data-test-pass]');
    assert.dom('[data-test-feedback="pass"]').hasText(/Pass/);
    await clock.advance(FEEDBACK_MS);
    const third = wordOnScreen();

    await clock.advance(30_000);
    assert.strictEqual(currentURL(), '/play/animals/results');
    assert.dom('[data-test-score]').hasText('1');
    assert.dom('[data-test-correct-list] li').exists({ count: 1 });
    assert.dom('[data-test-correct-list]').includesText(first);
    assert.dom('[data-test-passed-list] li').exists({ count: 2 });
    assert.dom('[data-test-passed-list]').includesText(second);
    assert
      .dom('[data-test-passed-list]')
      .includesText(third, 'the word left when time ran out counts as a pass');
  });

  test('a round with no answers shows empty lists', async function (assert) {
    await visit('/play/sports/round');
    await clock.advance((COUNTDOWN_SECONDS + 60) * 1000);

    assert.dom('[data-test-score]').hasText('0');
    assert.dom('[data-test-correct-list]').includesText('None this time.');
    assert.dom('[data-test-passed-list] li').exists({ count: 1 });
  });

  test('the results buttons go to the right places', async function (assert) {
    await visit('/play/animals/round');
    await clock.advance((COUNTDOWN_SECONDS + 60) * 1000);

    await click('[data-test-play-again]');
    assert.strictEqual(currentURL(), '/play/animals/round');
    assert.dom('[data-test-countdown]').exists('a fresh round starts');

    await clock.advance((COUNTDOWN_SECONDS + 60) * 1000);
    await click('[data-test-new-category]');
    assert.strictEqual(currentURL(), '/play');

    await visit('/play/animals/round');
    await clock.advance((COUNTDOWN_SECONDS + 60) * 1000);
    await click('[data-test-home]');
    assert.strictEqual(currentURL(), '/');
  });

  test('ending a round early goes back to Get ready', async function (assert) {
    await visit('/play/animals/round');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
    await click('[data-test-quit]');
    assert.strictEqual(currentURL(), '/play/animals');

    const game = this.owner.lookup('service:game') as GameService;
    assert.strictEqual(game.lastResult, undefined, 'no result is saved');
  });

  test('tilting down is correct and tilting up is a pass', async function (assert) {
    await visit('/play/animals');
    await click('[data-test-start]');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
    const first = wordOnScreen();

    await tilt.tiltPhone('down');
    assert.dom('[data-test-feedback="correct"]').exists();

    // A second tilt during the feedback is ignored.
    await tilt.tiltPhone('up');
    await clock.advance(FEEDBACK_MS);
    const second = wordOnScreen();

    await tilt.tiltPhone('up');
    assert.dom('[data-test-feedback="pass"]').exists();

    await clock.advance(60_000);
    assert.dom('[data-test-correct-list]').includesText(first);
    assert.dom('[data-test-passed-list]').includesText(second);
  });

  test('tilts during the countdown are ignored', async function (assert) {
    await visit('/play/animals/round');
    await tilt.tiltPhone('down');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
    assert.dom('[data-test-word]').exists();
    assert.dom('[data-test-feedback]').doesNotExist();
  });

  test('the round waits for the phone to turn sideways', async function (assert) {
    orientation.isLandscape = false;
    await visit('/play/animals/round');

    assert.dom('[data-test-turn-sideways]').exists();
    assert.dom('[data-test-countdown]').doesNotExist();

    await clock.advance(10_000);
    assert.dom('[data-test-turn-sideways]').exists('still waiting');

    orientation.isLandscape = true;
    await clock.advance(100);
    assert.dom('[data-test-turn-sideways]').doesNotExist();
    assert.dom('[data-test-countdown]').hasText('3');
  });

  test('turning the phone upright mid-round does not pause it', async function (assert) {
    await visit('/play/animals/round');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
    orientation.isLandscape = false;
    await clock.advance(1000);
    assert.dom('[data-test-word]').exists();
    assert.dom('[data-test-turn-sideways]').doesNotExist();
  });

  test('Start asks for motion access, and a refusal still lets you play by tapping', async function (assert) {
    tilt.nextAccess = 'denied';
    await visit('/play/animals');
    assert.dom('[data-test-tilt-off]').doesNotExist();

    await click('[data-test-start]');
    assert.strictEqual(currentURL(), '/play/animals/round');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
    await click('[data-test-correct]');
    assert.dom('[data-test-feedback="correct"]').exists('tapping still works');

    await click('[data-test-quit]');
    assert.dom('[data-test-tilt-off]').includesText('Tilt is off.');
  });

  test('unknown categories and missing results redirect', async function (assert) {
    await visit('/play/not-a-category');
    assert.strictEqual(currentURL(), '/play');

    await visit('/play/animals/results');
    assert.strictEqual(currentURL(), '/play/animals');
  });
});
