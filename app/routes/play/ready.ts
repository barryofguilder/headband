import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type CategoriesService from 'headband/services/categories';
import type { Category } from 'headband/categories';

/**
 * Loads the category from the URL. If it doesn't exist (for example, a custom
 * category that was deleted), goes back to the category list.
 */
export default class PlayReadyRoute extends Route {
  @service declare categories: CategoriesService;
  @service declare router: RouterService;

  model(params: { category_id: string }): Category | undefined {
    return this.categories.find(params.category_id);
  }

  afterModel(category: Category | undefined) {
    if (!category) {
      this.router.replaceWith('play.index');
    }
  }
}
