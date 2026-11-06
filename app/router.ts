import EmberRouter from '@embroider/router';
import config from 'headband/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('play', function () {
    this.route('ready', { path: '/:category_id' });
    this.route('round', { path: '/:category_id/round' });
    this.route('results', { path: '/:category_id/results' });
  });
  this.route('my-categories', function () {
    this.route('new');
    this.route('edit', { path: '/:category_id' });
  });
  this.route('how-to-play');
  this.route('settings');
  this.route('not-found', { path: '/*path' });
});
