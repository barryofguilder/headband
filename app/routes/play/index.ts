import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type CategoriesService from 'headband/services/categories';

export default class PlayIndexRoute extends Route {
  @service declare categories: CategoriesService;

  model() {
    return this.categories.all;
  }
}
