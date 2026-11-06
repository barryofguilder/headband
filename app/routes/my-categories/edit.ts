import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type CustomCategoriesService from 'headband/services/custom-categories';
import type { Category } from 'headband/categories';

/**
 * Loads one of the player's categories. Goes back to the list if it
 * doesn't exist.
 */
export default class MyCategoriesEditRoute extends Route {
  @service declare customCategories: CustomCategoriesService;
  @service declare router: RouterService;

  model(params: { category_id: string }): Category | undefined {
    return this.customCategories.find(params.category_id);
  }

  afterModel(category: Category | undefined) {
    if (!category) {
      this.router.replaceWith('my-categories.index');
    }
  }
}
