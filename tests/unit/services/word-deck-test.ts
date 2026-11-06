import { module, test } from 'qunit';
import { setupTest } from 'headband/tests/helpers';
import type WordDeckService from 'headband/services/word-deck';
import type { Category } from 'headband/categories';

const category = (words: string[]): Category => ({
  id: 'test-deck',
  name: 'Test',
  emoji: '🧪',
  words,
});

module('Unit | Service | word-deck', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    window.localStorage.removeItem('headband:deck:test-deck');
  });
  hooks.afterEach(function () {
    window.localStorage.removeItem('headband:deck:test-deck');
  });

  function deck(owner: { lookup(name: string): unknown }): WordDeckService {
    return owner.lookup('service:word-deck') as WordDeckService;
  }

  test('every word comes up once before any word repeats', function (assert) {
    const service = deck(this.owner);
    const words = ['A', 'B', 'C', 'D', 'E'];
    const drawn = words.map(() => service.draw(category(words)));

    assert.deepEqual([...drawn].sort(), words, 'each word drawn exactly once');
    assert.strictEqual(service.remaining(category(words)), 0);
  });

  test('remembers played words between rounds', function (assert) {
    const words = ['A', 'B', 'C', 'D'];
    const played = [
      deck(this.owner).draw(category(words)),
      deck(this.owner).draw(category(words)),
    ];

    // Simulate reopening the app: a new service has to read progress from storage.
    const reopened = this.owner
      .factoryFor('service:word-deck')!
      .create() as WordDeckService;
    const rest = [
      reopened.draw(category(words)),
      reopened.draw(category(words)),
    ];

    assert.deepEqual([...played, ...rest].sort(), words);
  });

  test('reshuffles after the whole category is played, without opening on the last word', function (assert) {
    const service = deck(this.owner);
    const words = ['A', 'B', 'C'];
    let last: string | undefined;
    for (let i = 0; i < words.length; i++) last = service.draw(category(words));

    const afterReshuffle = service.draw(category(words));
    assert.ok(afterReshuffle, 'keeps dealing');
    assert.notStrictEqual(afterReshuffle, last);
    assert.strictEqual(service.remaining(category(words)), 2);
  });

  test('handles words being added or removed after play started', function (assert) {
    const service = deck(this.owner);
    service.draw(category(['A', 'B', 'C']));

    const edited = category(['B', 'C', 'D']);
    const seen = new Set<string | undefined>();
    for (let i = 0; i < 3; i++) seen.add(service.draw(edited));

    assert.false(seen.has('A'), 'removed word never comes up');
    assert.ok(seen.has('D'), 'new word is dealt');
  });

  test('ignores blank and duplicate words', function (assert) {
    const service = deck(this.owner);
    const messy = category(['Dog', ' Dog ', '', '  ', 'Cat']);
    assert.strictEqual(service.remaining(messy), 2);
  });

  test('returns nothing for an empty category', function (assert) {
    assert.strictEqual(deck(this.owner).draw(category([])), undefined);
  });
});
