import { LinkTo } from '@ember/routing';
import { LOGO_URL } from 'headband/utils/asset-url';
import InstallBanner from 'headband/components/install-banner';

const buttonClass =
  'flex min-h-16 sideways:min-h-13 w-full items-center justify-center gap-3 rounded-2xl px-6 text-xl font-semibold active:scale-95 transition-transform';

<template>
  <section
    class="sideways:flex-row sideways:gap-10 flex flex-1 flex-col items-center justify-center gap-10"
  >
    <div
      class="sideways:flex-1 sideways:gap-2 flex flex-col items-center gap-4 text-center"
    >
      <img
        src={{LOGO_URL}}
        alt=""
        class="sideways:size-24 size-32 drop-shadow-lg"
      />
      <h1 class="text-teal text-4xl font-bold tracking-tight">Headband</h1>
      <p class="text-lg text-white/80">Guess the word on your head.</p>
    </div>

    <nav
      class="sideways:flex-1 sideways:gap-2 flex w-full flex-col gap-3"
      aria-label="Main menu"
    >
      <LinkTo
        @route="play"
        class="{{buttonClass}} bg-teal text-plum-900"
        data-test-menu="play"
      >
        <span aria-hidden="true">▶</span>
        Play
      </LinkTo>
      <LinkTo
        @route="my-categories"
        class="{{buttonClass}} bg-plum-700 text-white"
        data-test-menu="my-categories"
      >
        My categories
      </LinkTo>
      <LinkTo
        @route="how-to-play"
        class="{{buttonClass}} bg-plum-700 text-white"
        data-test-menu="how-to-play"
      >
        How to play
      </LinkTo>
      <LinkTo
        @route="settings"
        class="{{buttonClass}} bg-plum-700 text-white"
        data-test-menu="settings"
      >
        Settings
      </LinkTo>
    </nav>
  </section>

  <div class="sideways:mt-4 mt-6">
    <InstallBanner />
  </div>
</template>
