import EmberRouter from '@embroider/router';
import config from 'headband/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('play');
  this.route('my-categories');
  this.route('how-to-play');
  this.route('settings');
});
