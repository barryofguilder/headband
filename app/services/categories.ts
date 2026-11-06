import Service from '@ember/service';
import { builtInCategories, type Category } from 'headband/categories';

/**
 * Every category the player can choose from. Custom categories join the
 * built-in ones here in a later step.
 */
export default class CategoriesService extends Service {
  get all(): Category[] {
    return builtInCategories;
  }

  find(id: string): Category | undefined {
    return this.all.find((category) => category.id === id);
  }
}
