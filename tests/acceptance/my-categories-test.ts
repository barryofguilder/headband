import { module, test } from 'qunit';
import {
  click,
  currentURL,
  fillIn,
  find,
  settled,
  triggerKeyEvent,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'headband/tests/helpers';
import {
  useFakeClock,
  type FakeClock,
} from 'headband/tests/helpers/fake-clock';
import { useFakeDevice } from 'headband/tests/helpers/fake-device';
import { clearAppStorage } from 'headband/tests/helpers/storage';
import { COUNTDOWN_SECONDS } from 'headband/components/play-round';
import type CustomCategoriesService from 'headband/services/custom-categories';

module('Acceptance | my categories', function (hooks) {
  setupApplicationTest(hooks);

  let clock: FakeClock;

  hooks.beforeEach(function () {
    clearAppStorage();
    clock = useFakeClock(this.owner);
    useFakeDevice(this.owner);
  });
  hooks.afterEach(function () {
    clearAppStorage();
  });

  function customCategories(owner: { lookup(name: string): unknown }) {
    return owner.lookup('service:custom-categories') as CustomCategoriesService;
  }

  async function addWord(word: string): Promise<void> {
    await fillIn('[data-test-new-word]', word);
    await triggerKeyEvent('[data-test-new-word]', 'keydown', 'Enter');
  }

  async function paste(text: string): Promise<void> {
    const data = new DataTransfer();
    data.setData('text', text);
    find('[data-test-new-word]')!.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, cancelable: true }),
    );
    await settled();
  }

  test('shows a friendly message when there are no categories', async function (assert) {
    await visit('/my-categories');
    assert.dom('[data-test-no-categories]').includesText('No categories yet');
    await click('[data-test-new-category-button]');
    assert.strictEqual(currentURL(), '/my-categories/new');
  });

  test('making a category with a name, emoji, and words', async function (assert) {
    await visit('/my-categories/new');
    await fillIn('[data-test-category-name]', 'Movies');

    await click('[data-test-change-icon]');
    await click('[data-test-emoji="🎬"]');
    assert.dom('[data-test-icon-preview]').hasText('🎬');

    await addWord('Jaws');
    assert.dom('[data-test-new-word]').isFocused('Enter keeps focus too');
    await fillIn('[data-test-new-word]', 'Up');
    await click('[data-test-add-word]');
    assert
      .dom('[data-test-new-word]')
      .isFocused('the box keeps focus so the keyboard stays up');
    await paste('Frozen, Cars\nShrek');
    assert.dom('[data-test-word-count]').hasText('(5 words)');
    assert.dom('[data-test-new-word]').hasValue('');

    await addWord('jaws');
    assert.dom('[data-test-skipped]').includesText('jaws');
    assert.dom('[data-test-word-item]').exists({ count: 5 });

    await click('[data-test-remove-word="Cars"]');
    assert.dom('[data-test-word-count]').hasText('(4 words)');

    await click('[data-test-save]');
    assert.strictEqual(currentURL(), '/my-categories');
    assert.dom('[data-test-my-category]').exists({ count: 1 });
    assert.dom('[data-test-my-category]').includesText('Movies');
    assert.dom('[data-test-my-category]').includesText('4 words');

    const [saved] = customCategories(this.owner).categories;
    assert.strictEqual(saved?.emoji, '🎬');
    assert.deepEqual(saved?.words, ['Jaws', 'Up', 'Frozen', 'Shrek']);
  });

  test('a word left in the box when saving is kept', async function (assert) {
    await visit('/my-categories/new');
    await fillIn('[data-test-category-name]', 'Quick');
    await fillIn('[data-test-new-word]', 'Only word');
    await click('[data-test-save]');
    assert.deepEqual(customCategories(this.owner).categories[0]?.words, [
      'Only word',
    ]);
  });

  test('saving needs a name and at least one word', async function (assert) {
    await visit('/my-categories/new');
    assert
      .dom('[data-test-name-error]')
      .doesNotExist('no errors before trying');

    await click('[data-test-save]');
    assert.strictEqual(currentURL(), '/my-categories/new');
    assert
      .dom('[data-test-name-error]')
      .includesText('Give your category a name.');
    assert
      .dom('[data-test-words-error]')
      .includesText('Add at least one word.');
    assert.dom('[data-test-category-name]').hasAria('invalid', 'true');

    await fillIn('[data-test-category-name]', 'Named');
    assert.dom('[data-test-name-error]').doesNotExist();
    await addWord('Word');
    assert.dom('[data-test-words-error]').doesNotExist();
  });

  test('no emoji means the default icon, and any emoji can be typed', async function (assert) {
    await visit('/my-categories/new');
    assert.dom('[data-test-icon-preview] [data-test-default-icon]').exists();

    await click('[data-test-change-icon]');
    await fillIn('[data-test-custom-emoji]', 'abc');
    await click('[data-test-use-custom-emoji]');
    assert.dom('[data-test-custom-emoji-error]').exists();

    await fillIn('[data-test-custom-emoji]', '🦖');
    await click('[data-test-use-custom-emoji]');
    assert.dom('[data-test-icon-preview]').hasText('🦖');

    await click('[data-test-change-icon]');
    await click('[data-test-emoji-none]');
    assert.dom('[data-test-icon-preview] [data-test-default-icon]').exists();
  });

  test('editing a category', async function (assert) {
    const { id } = customCategories(this.owner).create({
      name: 'Family',
      words: ['Grandma', 'Uncle Bob'],
    });

    await visit('/my-categories');
    await click('[data-test-edit-category]');
    assert.strictEqual(currentURL(), `/my-categories/${id}`);
    assert.dom('[data-test-category-name]').hasValue('Family');
    assert.dom('[data-test-word-item]').exists({ count: 2 });

    await fillIn('[data-test-category-name]', 'Our Family');
    await click('[data-test-remove-word="Uncle Bob"]');
    await addWord('Cousin Amy');
    await click('[data-test-save]');

    assert.strictEqual(currentURL(), '/my-categories');
    const saved = customCategories(this.owner).find(id);
    assert.strictEqual(saved?.name, 'Our Family');
    assert.deepEqual(saved?.words, ['Grandma', 'Cousin Amy']);
  });

  test('deleting from the list asks first', async function (assert) {
    customCategories(this.owner).create({ name: 'Doomed', words: ['Bye'] });
    await visit('/my-categories');

    await click('[data-test-delete-category]');
    assert.dom('[data-test-confirm-dialog]').includesText('Delete Doomed?');
    await click('[data-test-confirm-cancel]');
    assert.dom('[data-test-confirm-dialog]').doesNotExist();
    assert.dom('[data-test-my-category]').exists();

    await click('[data-test-delete-category]');
    await click('[data-test-confirm]');
    assert.dom('[data-test-my-category]').doesNotExist();
    assert.dom('[data-test-no-categories]').exists();
    assert.strictEqual(customCategories(this.owner).categories.length, 0);
  });

  test('deleting from the edit screen', async function (assert) {
    const { id } = customCategories(this.owner).create({
      name: 'Doomed',
      words: ['Bye'],
    });
    await visit(`/my-categories/${id}`);
    await click('[data-test-delete]');
    await click('[data-test-confirm]');
    assert.strictEqual(currentURL(), '/my-categories');
    assert.strictEqual(customCategories(this.owner).find(id), undefined);
  });

  test('an unknown category id goes back to the list', async function (assert) {
    await visit('/my-categories/custom-nope');
    assert.strictEqual(currentURL(), '/my-categories');
  });

  test('custom categories show up to play, marked Mine, and can be played', async function (assert) {
    const { id } = customCategories(this.owner).create({
      name: 'Snacks',
      emoji: '🍿',
      words: ['Popcorn', 'Pretzels'],
    });
    customCategories(this.owner).create({ name: 'Nothing yet', words: [] });

    await visit('/play');
    assert.dom(`[data-test-category="${id}"]`).includesText('Snacks');
    assert.dom(`[data-test-category="${id}"] [data-test-mine]`).hasText('Mine');
    assert
      .dom('[data-test-category="animals"] [data-test-mine]')
      .doesNotExist();
    assert.dom('[data-test-categories]').doesNotIncludeText('Nothing yet');

    await click(`[data-test-category="${id}"]`);
    await click('[data-test-start]');
    await clock.advance(COUNTDOWN_SECONDS * 1000);
    assert.dom('[data-test-word]').hasText(/Popcorn|Pretzels/);
  });

  test('Make your own on the category list opens a new category', async function (assert) {
    await visit('/play');
    await click('[data-test-make-your-own]');
    assert.strictEqual(currentURL(), '/my-categories/new');
  });
});
