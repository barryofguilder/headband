import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

/**
 * Deployment path. See the matching note in config/environment.js, which
 * reads the same variable so the two can't drift. This is the path the
 * BROWSER requests, not where the origin stores the files. Development and
 * tests always use '/'.
 */
const ROOT_URL = process.env.ROOT_URL || '/headband/';

/**
 * The short commit this build came from, shown on How to play so you can
 * tell which version a phone is running. Render sets RENDER_GIT_COMMIT.
 */
function appVersion() {
  if (process.env.RENDER_GIT_COMMIT) {
    return process.env.RENDER_GIT_COMMIT.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig(({ command, mode, isPreview }) => ({
  // Production builds and `pnpm preview` (which serves that build) use the
  // deployment path. The dev server and `pnpm test` stay at '/'.
  base:
    (command === 'build' && mode === 'production') || isPreview
      ? ROOT_URL
      : '/',
  define: {
    // True only for `pnpm start`. Turns on dev-only conveniences, like the 5 second round.
    __DEV_SERVER__: JSON.stringify(command === 'serve'),
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  plugins: [
    // `pnpm start:phone` serves over HTTPS. Phones only allow tilt on HTTPS.
    ...(process.env.HTTPS ? [basicSsl()] : []),
    classicEmberSupport(),
    ember(),
    tailwindcss(),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    VitePWA({
      // The app decides when to switch to a new version, so it never reloads
      // mid-round (see app/services/app-update.ts). It also registers the
      // service worker itself, so nothing is injected into index.html.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Headband',
        short_name: 'Headband',
        description: 'Guess who you are. A party game for your phone.',
        theme_color: '#2f193b',
        background_color: '#2f193b',
        display: 'standalone',
        // Every screen works both ways. The round asks for landscape itself.
        orientation: 'any',
        // Relative, so they resolve against the manifest's own URL and work
        // under any ROOT_URL.
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
}));
