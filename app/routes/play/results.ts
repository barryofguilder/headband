import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type CategoriesService from 'headband/services/categories';
import type GameService from 'headband/services/game';
import type { Category } from 'headband/categories';
import type { RoundResult } from 'headband/services/game';
import type Transition from '@ember/routing/transition';

export interface ResultsModel {
  category: Category;
  result: RoundResult;
}

/**
 * Shows the last round. With no round to show (for example, after a page
 * reload), goes to the Get ready screen instead.
 */
export default class PlayResultsRoute extends Route {
  @service declare categories: CategoriesService;
  @service declare game: GameService;
  @service declare router: RouterService;

  model(params: { category_id: string }): ResultsModel | undefined {
    const category = this.categories.find(params.category_id);
    const result = this.game.lastResult;
    if (!category || result?.categoryId !== category.id) {
      return undefined;
    }
    return { category, result };
  }

  afterModel(model: ResultsModel | undefined, transition: Transition) {
    if (!model) {
      const categoryId = transition.to?.params?.['category_id'];
      if (typeof categoryId === 'string' && this.categories.find(categoryId)) {
        this.router.replaceWith('play.ready', categoryId);
      } else {
        this.router.replaceWith('play.index');
      }
    }
  }
}
