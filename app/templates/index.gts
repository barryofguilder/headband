import { LinkTo } from '@ember/routing';

const button =
  'flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-6 text-xl font-semibold active:scale-95 transition-transform';

<template>
  <section class="flex flex-1 flex-col items-center justify-center gap-10">
    <div class="flex flex-col items-center gap-4 text-center">
      <img src="/logo.svg" alt="" class="size-32 drop-shadow-lg" />
      <h1 class="text-teal text-4xl font-bold tracking-tight">Headband</h1>
      <p class="text-lg text-white/80">Guess the word on your head.</p>
    </div>

    <nav class="flex w-full flex-col gap-3" aria-label="Main menu">
      <LinkTo
        @route="play"
        class="{{button}} bg-teal text-plum-900"
        data-test-menu="play"
      >
        <span aria-hidden="true">▶</span>
        Play
      </LinkTo>
      <LinkTo
        @route="my-categories"
        class="{{button}} bg-plum-700 text-white"
        data-test-menu="my-categories"
      >
        My categories
      </LinkTo>
      <LinkTo
        @route="how-to-play"
        class="{{button}} bg-plum-700 text-white"
        data-test-menu="how-to-play"
      >
        How to play
      </LinkTo>
      <LinkTo
        @route="settings"
        class="{{button}} bg-plum-700 text-white"
        data-test-menu="settings"
      >
        Settings
      </LinkTo>
    </nav>
  </section>
</template>
