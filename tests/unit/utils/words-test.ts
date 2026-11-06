import { module, test } from 'qunit';
import { cleanWords, splitWords } from 'headband/utils/words';

module('Unit | Utility | words', function () {
  test('cleanWords trims, drops blanks, and drops repeats regardless of capitals', function (assert) {
    assert.deepEqual(
      cleanWords([' Dog ', '', 'cat', 'DOG', 'Big   Bird', '  ']),
      ['Dog', 'cat', 'Big Bird'],
    );
  });

  test('splitWords splits on commas and new lines', function (assert) {
    assert.deepEqual(splitWords('Dog, Cat\nHorse\r\nPig,,'), [
      'Dog',
      'Cat',
      'Horse',
      'Pig',
    ]);
    assert.deepEqual(splitWords('Hot dog stand'), ['Hot dog stand']);
    assert.deepEqual(splitWords('   '), []);
  });
});
