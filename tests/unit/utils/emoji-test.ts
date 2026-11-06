import { module, test } from 'qunit';
import { firstEmoji } from 'headband/utils/emoji';

module('Unit | Utility | emoji', function () {
  test('returns the first emoji, including ones made of several characters', function (assert) {
    assert.strictEqual(firstEmoji('🍕'), '🍕');
    assert.strictEqual(firstEmoji(' 🎬🍿 '), '🎬');
    assert.strictEqual(firstEmoji('👨‍👩‍👧'), '👨‍👩‍👧');
    assert.strictEqual(firstEmoji('🇺🇸'), '🇺🇸');
    assert.strictEqual(firstEmoji('✈️'), '✈️');
  });

  test('returns undefined for text that is not an emoji', function (assert) {
    assert.strictEqual(firstEmoji(''), undefined);
    assert.strictEqual(firstEmoji('abc'), undefined);
    assert.strictEqual(firstEmoji('7'), undefined);
    assert.strictEqual(firstEmoji('a🍕'), undefined);
  });
});
