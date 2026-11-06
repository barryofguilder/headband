import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "Headband"}}

  <div
    class="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
  >
    <header class="py-4 text-center">
      <h1 class="text-teal text-2xl font-bold tracking-tight">Headband</h1>
    </header>

    <main class="flex flex-1 flex-col">
      {{outlet}}
    </main>
  </div>
</template>
