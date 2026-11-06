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
- `pnpm build && pnpm preview --host` tests the PWA on a phone. Installing on iOS needs HTTPS.
- `pnpm lint` runs all linters, including the type check (`lint:types`).
- `pnpm test` builds and runs the QUnit tests in headless Chrome.

Run `pnpm format`, `pnpm lint` and `pnpm test` before saying a step is done.

## Workflow preferences

- Work directly on `master`. Don't create branches.
- The game is built in small steps. Commit only when asked, usually after each step. Don't push unless asked.
- Never add a `Co-Authored-By: Claude` line or any other Claude attribution to commit messages.

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

Players may be in a loud, busy room or holding the phone at arm's length. Keep text large and tap targets at least 48px. Never rely on color alone to show meaning. For example, "Correct!" or "Pass" is always written out, not only shown in green or red. Use plain, short wording.

## Categories

- Each built-in category is one file in `app/categories/built-in/`, exporting a `Category` (`id`, `name`, `emoji`, `words`). Files are picked up automatically through `import.meta.glob`, so nothing needs registering.
- Never change a category `id` once it's in use. Played-word history is stored by id.
- `tests/unit/categories/built-in-test.ts` checks that every category is valid: at least 20 words and no duplicates.
- Keep words familiar to a general US audience. Avoid obscure entries.
- `app/services/word-deck.ts` deals words in shuffled order. Every word comes up once before any word repeats, and this is remembered across rounds and app restarts.

## Game design

- Tilt is the main control, with tap as a backup (top half to pass, bottom half for correct). iOS needs a motion permission prompt from a user tap, plus HTTPS.
- Rounds default to 60 seconds. The default is set in Settings and can be changed on the Get ready screen, and that change is remembered. A 3-2-1 countdown starts each round.
- Rounds are played in landscape, and the menus stay upright. iOS can't lock orientation for each screen, so the manifest needs `orientation: "any"` (it's currently `"portrait"`), and the player is asked to turn the phone sideways.
- Score is per round only, with no running totals or teams. The word on screen when time runs out counts as a pass.
- Results show the score, the words guessed right and the words passed, with the buttons "Play again", "New category" and "Home".
- Screen flow: Home (Play, My categories, How to play, Settings), then Pick a category, Get ready, 3-2-1, Round, Results.
- Players can create, edit and delete their own categories, saved on the device. Each one can have an optional emoji, and a default icon is used when none is picked. Delete asks for confirmation first.

### Build steps

1. Home menu, How to play, the category format with Animals and Sports, and the word dealing. Done.
2. A playable game with tap controls: Pick a category, Get ready, the countdown, the round and Results. Done.
3. Tilt, landscape and the iOS motion permission.
4. My categories: create, edit and delete, with the emoji picker.
5. The Settings screen and polish.

### Future enhancements (after the base game)

- A share link that packs custom categories into a URL, so another player can open it and add them. File export and import were considered and dropped in favor of the link.
- A photo picker for custom categories, using the camera or photo library, stored on the device as a small thumbnail. Photos aren't included in share links. The emoji or the default icon is used instead.
