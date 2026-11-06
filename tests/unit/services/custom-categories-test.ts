import { module, test } from 'qunit';
import { setupTest } from 'headband/tests/helpers';
import { clearAppStorage } from 'headband/tests/helpers/storage';
import type CustomCategoriesService from 'headband/services/custom-categories';
import type CategoriesService from 'headband/services/categories';

module('Unit | Service | custom-categories', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    clearAppStorage();
  });
  hooks.afterEach(function () {
    clearAppStorage();
  });

  function service(owner: { lookup(name: string): unknown }) {
    return owner.lookup('service:custom-categories') as CustomCategoriesService;
  }

  function reopen(owner: {
    factoryFor(name: string): { create(): unknown } | undefined;
  }): CustomCategoriesService {
    return owner
      .factoryFor('service:custom-categories')!
      .create() as CustomCategoriesService;
  }

  test('creates a category and remembers it after reopening', function (assert) {
    const created = service(this.owner).create({
      name: '  Movies ',
      emoji: '🎬',
      words: ['Jaws', ' jaws', 'Up', ''],
    });

    assert.true(created.id.startsWith('custom-'));
    assert.strictEqual(created.name, 'Movies');
    assert.deepEqual(created.words, ['Jaws', 'Up']);
    assert.true(created.isCustom);

    const reopened = reopen(this.owner);
    assert.deepEqual(reopened.find(created.id), created);
  });

  test('a category without an emoji has no emoji', function (assert) {
    const created = service(this.owner).create({
      name: 'Family',
      emoji: '  ',
      words: ['Grandma'],
    });
    assert.false('emoji' in created);
  });

  test('updates and deletes', function (assert) {
    const custom = service(this.owner);
    const { id } = custom.create({ name: 'A', words: ['One'] });

    custom.update(id, { name: 'B', emoji: '⭐', words: ['Two', 'Three'] });
    assert.strictEqual(reopen(this.owner).find(id)?.name, 'B');
    assert.deepEqual(reopen(this.owner).find(id)?.words, ['Two', 'Three']);

    custom.delete(id);
    assert.strictEqual(reopen(this.owner).find(id), undefined);
  });

  test('skips saved data that does not look right', function (assert) {
    window.localStorage.setItem(
      'headband:custom-categories',
      JSON.stringify([
        { id: 'custom-1', name: 'Good', words: ['Yes', 7, null] },
        { id: 'custom-2', words: ['No name'] },
        'nonsense',
        null,
      ]),
    );
    const categories = reopen(this.owner).categories;
    assert.strictEqual(categories.length, 1);
    assert.deepEqual(categories[0]?.words, ['Yes']);
  });

  test('custom categories come after built-in ones, and empty ones are not playable', function (assert) {
    const custom = service(this.owner);
    custom.create({ name: 'Zebras', words: ['Stripes'] });
    custom.create({ name: 'Apples', words: ['Red'] });
    const empty = custom.create({ name: 'Empty', words: [] });

    const categories = this.owner.lookup(
      'service:categories',
    ) as CategoriesService;
    const names = categories.all.map((category) => category.name);
    assert.deepEqual(names.slice(-3), ['Apples', 'Empty', 'Zebras']);
    assert.notOk(
      categories.playable.some((category) => category.id === empty.id),
    );
  });
});
