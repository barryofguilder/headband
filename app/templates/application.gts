import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "Headband"}}

  <div
    class="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]"
  >
    {{outlet}}
  </div>
</template>
