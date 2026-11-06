import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'headband/config/environment';
import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';
import setupInspector from '@embroider/legacy-inspector-support/ember-source-4.12';
import 'headband/styles/app.css';
import { preventZoom } from 'headband/utils/prevent-zoom';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

// The game lives in a folder (rootURL, like /headband/). Someone typing
// barryofguilder.com/headband without the last slash wouldn't match it, so
// add the slash before the router reads the address.
if (`${window.location.pathname}/` === config.rootURL) {
  window.history.replaceState(
    window.history.state,
    '',
    `${config.rootURL}${window.location.search}${window.location.hash}`,
  );
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(compatModules);
  inspector = setupInspector(this);
}

loadInitializers(App, config.modulePrefix, compatModules);

preventZoom();
