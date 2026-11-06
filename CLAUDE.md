# Headband

A party game for your phone. One player holds the phone to their forehead, everyone else gives clues, and the player tilts the phone down for a right answer or up to pass. It's a mobile-first Ember app that works offline and can be installed to the home screen as a PWA.

## Stack

- Ember 7.3 (Octane, Embroider + Vite), TypeScript, `.gts` template tag components
- Tailwind CSS v4 via `@tailwindcss/vite`, set up in `app/styles/app.css`. Brand colors are `teal`, `plum-900`, `plum-700` and `plum-500`.
- `vite-plugin-pwa` for the service worker and manifest (`vite.config.mjs`). Icons are generated from `public/logo.svg` with `pnpm generate-pwa-assets`.
- pnpm

## Commands

- `pnpm start` runs the dev server. The service worker only runs in a production build.
- `__DEV_SERVER__` (set in `vite.config.mjs`, typed in `types/dev-server.d.ts`) is `true` only under `pnpm start`. Use it for dev-only shortcuts, such as the 5 second round length. It's `false` in production builds and in `pnpm test`.
- `pnpm start:phone` runs the dev server over HTTPS on your network, so you can open it on a phone. Phones only allow tilt on HTTPS. The certificate is self-signed, so the browser shows a warning to tap through once.
- `pnpm preview:phone` builds and serves the production app over HTTPS. Use it to test offline mode and installing to the home screen.
- `pnpm lint` runs all linters, including the type check (`lint:types`).
- `pnpm test` builds and runs the QUnit tests in headless Chrome.

Run `pnpm format`, `pnpm lint` and `pnpm test` before saying a step is done.

## Workflow preferences

- Work directly on `master`. Don't create branches.
- The game is built in small steps. Commit only when asked, usually after each step. Don't push unless asked.
- Never add a `Co-Authored-By: Claude` line or any other Claude attribution to commit messages.

## Deploying

- Hosted as a Render static site, reached at `barryofguilder.com/headband/` through a rewrite on the main domain that strips the prefix (the same setup as reverse-audio). The build must target `/headband/`, the path the BROWSER requests, even though Render serves from its own root.
- `ROOT_URL` (default `/headband/`) feeds both Ember's `rootURL` (`config/environment.js`) and Vite's `base` (`vite.config.mjs`), so they can't drift. Production builds and `pnpm preview` use it; the dev server and tests use `/`. Build with `ROOT_URL=/` to serve straight off the Render URL.
- Unlike reverse-audio, the game has real pages (`/play/animals`, `/my-categories/...`), so it keeps `locationType: 'history'`. Render needs a rewrite of `/*` to `/index.html` so reloading or opening a deep link works. Unknown paths go to Home (`app/routes/not-found.ts`), and `app/app.ts` adds the trailing slash when someone visits `/headband`.
- Files in `public/` referenced from app code must go through `assetUrl()` or `LOGO_URL` in `app/utils/asset-url.ts`. A bare `/logo.svg` skips the folder and 404s. Root-relative links in `index.html` and `url()` in CSS are rewritten by Vite automatically.
- Updates: the service worker uses `registerType: 'prompt'`, and `app/services/app-update.ts` registers it (production builds only) and decides when to switch. It watches the registration itself (`updatefound` and `statechange`) and switches by posting `SKIP_WAITING` to the waiting worker, then reloads on `controllerchange` (with a fallback reload after 4 seconds). Relying on workbox-window's events didn't switch versions on iPhone while the app was open. Settings shows the version, the update status, and a Check for updates button. It checks when the app opens, when it comes back from the background, and every hour, then reloads into the new version unless the player is on a screen in `UNSAFE_ROUTES` (the round, results, or the category form), in which case it waits until they leave. `workbox-window` must stay a dev dependency: without it, the build leaves a bare `import("workbox-window")` that fails in the browser, and the service worker silently never registers.
- How to play shows the build's short commit ("Version abc1234", from `__APP_VERSION__` in `vite.config.mjs`). Use it to check whether a phone has picked up a deploy. The installed app shows its stored copy first and downloads updates in the background, so a new version may need the app to be fully closed and reopened.
- Don't set `overscroll-behavior` on `html` or `body`. Both `none` and `contain` seemed to turn off iPhone's bounce, which made scrolling feel stiff. Only the round uses `overscroll-none`.
- The manifest's `start_url` and `scope` are relative (`./`) so they work under any `ROOT_URL`.
- The headband site's settings live in `render.yaml` (a Render Blueprint), so change them there, not in the dashboard. It deploys only after the GitHub checks in `.github/workflows/ci.yml` (lint and tests) pass (`autoDeployTrigger: checksPass`). The pnpm version comes from `packageManager` in `package.json`, for both CI and local use. Node is pinned with Volta (`volta.node` in `package.json`), and `engines.node` is pinned to the same exact version. CI reads the Volta pin and Render reads `engines`, so change both together.
- Render rules, in order. On the **barryofguilder** site (main domain), above its catch-all `/` rule, all Rewrite. These live in `render.yaml` in the `barryofguilder` repo (a Blueprint), so change them there, not in the dashboard:
  - `/headband` → `https://headband-mqcf.onrender.com/`
  - `/headband/*` → `https://headband-mqcf.onrender.com/*`
- On the **headband** site, both Rewrite:
  - `/assets/*` → `/assets/`, so a missing asset (like an old hashed file after a deploy) gets a 404 instead of `index.html`, which would fail with a MIME type error.
  - `/*` → `/index.html`, so deep links and reloads work.
- After changing rules, they can take a minute to reach all of Render's servers. Requests may fail on and off until then.
- `app/services/install.ts` is started by an instance initializer so Chrome's `beforeinstallprompt` isn't missed. Because it starts at boot, tests can't swap it with `owner.register`. Adjust the running service instead (see `tests/acceptance/install-banner-test.ts`).

## Code style

- Write doc comments in multi-line JSDoc format, even short ones. Don't use the one-line `/** ... */` form.

  ```ts
  /**
   * Returns a new array in random order.
   */
  ```

  Plain `//` comments inside function bodies are fine.

- Always use braces for `if`, `else`, `for` and `while`, even for one-line bodies. ESLint enforces this with `curly: ['error', 'all']`.
- Inject services with a bare `@service declare wordDeck: WordDeckService;`. Don't pass the name, as in `@service('word-deck')`, when it matches the property, because the resolver maps camelCase to the dasherized name.
- In `.gts` files, never give a variable the name of an HTML tag, such as `button` or `input`. A variable in scope takes priority over the tag, so `<button>` would be treated as a component. Name class string constants like `buttonClass`.
- Template-only components are typed with `TOC<Signature>` from `@ember/component/template-only`.
- Add `data-test-*` attributes to elements that tests select.
- Anything time-based goes through the `clock` service (`app/services/clock.ts`). Tests swap in `FakeClock` from `tests/helpers/fake-clock.ts` and move time with `clock.advance(ms)`, so they never wait in real time.
- localStorage access goes through `app/utils/storage.ts`, which adds the `headband:` key prefix and fails quietly when storage is unavailable.

## Accessibility

Players may be in a loud, busy room or holding the phone at arm's length. Keep text large and tap targets at least 48px. Zoom is turned off so the game feels like a native app (viewport meta tag, `touch-action: pan-x pan-y` in `app/styles/app.css`, and `app/utils/prevent-zoom.ts`), so players can't enlarge small text. Body text should be at least 16px, which also stops iOS from zooming into text fields. Never rely on color alone to show meaning. For example, "Correct!" or "Pass" is always written out, not only shown in green or red. Use plain, short wording.

## Categories

- Each built-in category is one file in `app/categories/built-in/`, exporting a `Category` (`id`, `name`, `emoji`, `words`). Files are picked up automatically through `import.meta.glob`, so nothing needs registering.
- Never change a category `id` once it's in use. Played-word history is stored by id.
- `tests/unit/categories/built-in-test.ts` checks that every category is valid: at least 20 words and no duplicates.
- Keep words familiar to a general US audience. Avoid obscure entries.
- `app/services/word-deck.ts` deals words in shuffled order. Every word comes up once before any word repeats, and this is remembered across rounds and app restarts.

## Game design

- Tilt is the main control, with tap as a backup (top half to pass, bottom half for correct). Settings has a Tap to answer switch, off by default so bumping the screen while tilting doesn't count. With it off, the tap zones become tilt hints, but taps still work whenever tilt can't: motion access refused, or no tilt readings (`tilt.hasReadings`). See `tapsWork` in `app/components/play-round.gts`. iOS needs a motion permission prompt from a user tap, plus HTTPS.
- Rounds default to 60 seconds. The default is set in Settings and can be changed on the Get ready screen, and that change is remembered. A 3-2-1 countdown starts each round.
- The game is played on phones. Every screen except the round works in both portrait and landscape, and the manifest uses `orientation: "any"`.
  - Landscape layouts use the `sideways:` Tailwind variant (defined in `app/styles/app.css`): landscape and under 540px tall. Desktop browsers are tall enough to keep the portrait-style column. To check landscape on a desktop, use Chrome's device toolbar or a short window.
  - The round is landscape only. It waits on "Turn your phone sideways" until the screen is landscape, and Android installs also lock to landscape during the round. If the motion sensor says the phone has been sideways for a second but the screen is still portrait (iPhone rotation lock is on), the round draws itself sideways with a CSS rotation instead. "Play without turning" starts the round upright, for when there's no sensor to notice.
  - Once a round starts, turning the phone doesn't pause it.
- Tilt (`app/services/tilt.ts`) measures how far the screen faces the floor or ceiling from the `deviceorientation` angles, so it works in either landscape direction. Past about 30 degrees counts, and the phone has to return near upright before the next tilt counts. Tests use `FakeTilt` and `FakeOrientation` from `tests/helpers/fake-device.ts`.
- The round asks the browser to keep the screen on (`app/utils/wake-lock.ts`), since nobody touches the screen when playing by tilt.
- Score is per round only, with no running totals or teams. The word on screen when time runs out counts as a pass.
- Results show the score, the words guessed right and the words passed, with the buttons "Play again", "New category" and "Home".
- Screen flow: Home (Play, My categories, How to play, Settings), then Pick a category, Get ready, 3-2-1, Round, Results.
- Players can create, edit and delete their own categories, saved on the device. Each one can have an optional emoji, and a default icon (the Headband logo, `app/components/category-icon.gts`) is used when none is picked. Delete asks for confirmation first, using `app/components/confirm-dialog.gts`.
  - `app/services/custom-categories.ts` saves them under the `custom-categories` storage key, with ids like `custom-<uuid>`. `app/services/categories.ts` combines built-in and custom categories. Use `categories.playable` for anything the player can start, since a custom category can have no words.
  - Saving needs a name and at least one word. Words are cleaned by `cleanWords` in `app/utils/words.ts`: trimmed, blanks dropped, and repeats dropped regardless of capitals. Pasting a list with commas or line breaks adds every word.
  - Deleting a category also clears its played-word history (`wordDeck.forget`).

### Build steps

1. Home menu, How to play, the category format with Animals and Sports, and the word dealing. Done.
2. A playable game with tap controls: Pick a category, Get ready, the countdown, the round and Results. Done.
3. Tilt, landscape and the iOS motion permission. Done.
4. My categories: create, edit and delete, with the emoji picker. Done.
5. The Settings screen (round length and Tap to answer, done) and polish, plus an "add to your home screen" banner on Home (banner done) for players using a browser instead of the installed app. Detect the installed app with `matchMedia('(display-mode: standalone)')` or `navigator.standalone`. Android Chrome can show its own install prompt (`beforeinstallprompt`). iPhone needs written steps, chosen by Safari version (`Version/NN` in the user agent, since iOS no longer reports its real version), with a fallback for unknown versions. Keep the steps for each version in one file so new iOS releases are easy to add. Steps known so far:
   - iOS 27 Safari: tap the page menu button left of the address (a puzzle piece over lines), then Share, then View More, then Add to Home Screen. Leave "Open as Web App" turned on so the game opens full screen. Confirmed by Jason.
   - iOS 26 Safari: tap ••• next to the address, then Share, then Add to Home Screen (possibly under View More). Not yet confirmed.
   - iOS 18 and earlier: tap Share in the bottom toolbar, then Add to Home Screen. Not yet confirmed.
   - Chrome on iPhone: Share is in the address bar. In-app browsers (Instagram, Messenger) can't add to the home screen, so tell players to open the page in Safari.

### Future enhancements (after the base game)

- A share link that packs custom categories into a URL, so another player can open it and add them. File export and import were considered and dropped in favor of the link.
- A photo picker for custom categories, using the camera or photo library, stored on the device as a small thumbnail. Photos aren't included in share links. The emoji or the default icon is used instead.
