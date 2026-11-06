'use strict';

/**
 * Deployment path: the path the BROWSER sees, which isn't where the files sit
 * on the origin server.
 *
 * The game is reached at barryofguilder.com/headband/, where a rewrite
 * proxies through to the Render static site that hosts it. The rewrite strips
 * the prefix on the way, so Render serves the files from its own root. The
 * browser still asks for /headband/assets/..., so that's what the build needs.
 *
 * Override to build for somewhere else, like ROOT_URL=/ to run straight off
 * the Render URL. vite.config.mjs reads the same variable, so `rootURL` and
 * Vite's `base` can't drift apart.
 */
const ROOT_URL = process.env.ROOT_URL || '/headband/';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'headband',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    ENV.rootURL = ROOT_URL;
  }

  return ENV;
};
