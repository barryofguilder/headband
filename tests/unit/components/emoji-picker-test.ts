import { module, test } from 'qunit';
import { EMOJI_CHOICES } from 'headband/components/emoji-picker';
import { firstEmoji } from 'headband/utils/emoji';

module('Unit | emoji picker choices', function () {
  test('every choice is a single emoji, listed once', function (assert) {
    const all = EMOJI_CHOICES;
    assert.strictEqual(new Set(all).size, all.length, 'no repeats');
    for (const emoji of all) {
      assert.strictEqual(firstEmoji(emoji), emoji, `${emoji} is one emoji`);
    }
  });
});
