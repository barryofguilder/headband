import { module, test } from 'qunit';
import { click, currentURL, visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'headband/tests/helpers';

module('Acceptance | main menu', function (hooks) {
  setupApplicationTest(hooks);

  test('shows the four menu options', async function (assert) {
    await visit('/');
    assert.dom('[data-test-menu]').exists({ count: 4 });
    assert.dom('[data-test-menu="play"]').includesText('Play');
  });

  test('each menu option opens its screen and Back returns home', async function (assert) {
    for (const [route, url] of [
      ['play', '/play'],
      ['my-categories', '/my-categories'],
      ['how-to-play', '/how-to-play'],
      ['settings', '/settings'],
    ] as const) {
      await visit('/');
      await click(`[data-test-menu="${route}"]`);
      assert.strictEqual(currentURL(), url);
      await click('[data-test-back]');
      assert.strictEqual(currentURL(), '/');
    }
  });

  test('How to play lists the steps', async function (assert) {
    await visit('/how-to-play');
    assert.dom('[data-test-how-to-play] li').exists({ count: 6 });
  });

  test('an unknown address goes to the Home screen', async function (assert) {
    await visit('/not/a/real/page');
    assert.strictEqual(currentURL(), '/');
    assert.dom('[data-test-menu]').exists({ count: 4 });
  });
});
