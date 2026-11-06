import { module, test } from 'qunit';
import { builtInCategories } from 'headband/categories';

module('Unit | built-in categories', function () {
  test('Animals and Sports are loaded', function (assert) {
    const ids = builtInCategories.map((category) => category.id);
    assert.ok(ids.includes('animals'));
    assert.ok(ids.includes('sports'));
  });

  test('every category is valid', function (assert) {
    const ids = new Set<string>();
    for (const category of builtInCategories) {
      assert.ok(category.id, `${category.name} has an id`);
      assert.notOk(ids.has(category.id), `${category.id} is unique`);
      ids.add(category.id);
      assert.ok(category.name, `${category.id} has a name`);
      assert.ok(category.emoji, `${category.id} has an emoji`);
      assert.ok(
        category.words.length >= 20,
        `${category.id} has at least 20 words`,
      );
      const lower = category.words.map((word) => word.trim().toLowerCase());
      assert.strictEqual(
        new Set(lower).size,
        lower.length,
        `${category.id} has no duplicate words`,
      );
    }
  });
});
