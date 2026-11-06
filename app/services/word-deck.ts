import Service from '@ember/service';
import type { Category } from 'headband/categories';
import { readJSON, writeJSON } from 'headband/utils/storage';
import { shuffle } from 'headband/utils/shuffle';

interface DeckState {
  /**
   * Words not played yet, in the order they will come up.
   */
  queue: string[];
  /**
   * Words already played since the last reshuffle.
   */
  used: string[];
}

/**
 * Deals words from a category in random order. Every word comes up once
 * before any word repeats, and this is remembered between rounds and visits.
 */
export default class WordDeckService extends Service {
  random: () => number = Math.random;

  /**
   * Takes the next word from the category and marks it as played.
   */
  draw(category: Category): string | undefined {
    const words = uniqueWords(category.words);
    if (words.length === 0) return undefined;

    const state = this.#sync(category.id, words);

    if (state.queue.length === 0) {
      // Everything has been played. Start over, but don't open with the word we just saw.
      const last = state.used.at(-1);
      state.queue = shuffle(words, this.random);
      if (state.queue.length > 1 && state.queue[0] === last) {
        state.queue.push(state.queue.shift()!);
      }
      state.used = [];
    }

    const word = state.queue.shift()!;
    state.used.push(word);
    writeJSON(storageKey(category.id), state);
    return word;
  }

  /**
   * How many words are left before the category reshuffles.
   */
  remaining(category: Category): number {
    const words = uniqueWords(category.words);
    return this.#sync(category.id, words).queue.length;
  }

  /**
   * Loads the saved state and brings it in line with the current word list,
   * since categories can be edited after words were played.
   */
  #sync(categoryId: string, words: string[]): DeckState {
    const saved = readJSON<DeckState>(storageKey(categoryId));
    if (!saved || !Array.isArray(saved.queue) || !Array.isArray(saved.used)) {
      return { queue: shuffle(words, this.random), used: [] };
    }

    const current = new Set(words);
    const queue = saved.queue.filter((word) => current.has(word));
    const used = saved.used.filter((word) => current.has(word));

    // Words added since last time go into the queue at random spots.
    const known = new Set([...queue, ...used]);
    for (const word of words) {
      if (!known.has(word)) {
        const index = Math.floor(this.random() * (queue.length + 1));
        queue.splice(index, 0, word);
      }
    }

    return { queue, used };
  }
}

function storageKey(categoryId: string): string {
  return `deck:${categoryId}`;
}

function uniqueWords(words: string[]): string[] {
  return [...new Set(words.map((word) => word.trim()).filter(Boolean))];
}
