import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';

/**
 * Any address the game doesn't know, like an old or mistyped link, goes to
 * the Home screen.
 */
export default class NotFoundRoute extends Route {
  @service declare router: RouterService;

  beforeModel() {
    this.router.replaceWith('index');
  }
}
