import Service, { service } from '@ember/service';
import { builtInCategories, type Category } from 'headband/categories';
import type CustomCategoriesService from 'headband/services/custom-categories';

/**
 * Every category the player can choose from: the built-in ones, then the
 * player's own, each sorted by name.
 */
export default class CategoriesService extends Service {
  @service declare customCategories: CustomCategoriesService;

  get all(): Category[] {
    const custom = [...this.customCategories.categories].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return [...builtInCategories, ...custom];
  }

  /**
   * Categories with at least one word, so they can be played.
   */
  get playable(): Category[] {
    return this.all.filter((category) => category.words.length > 0);
  }

  find(id: string): Category | undefined {
    return this.all.find((category) => category.id === id);
  }
}
