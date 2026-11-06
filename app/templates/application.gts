import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "Headband"}}

  <div
    class="sideways:max-w-3xl sideways:pt-[max(env(safe-area-inset-top),0.5rem)] mx-auto flex min-h-dvh w-full max-w-md flex-col pt-[max(env(safe-area-inset-top),1rem)] pr-[max(env(safe-area-inset-right),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)] pl-[max(env(safe-area-inset-left),1rem)]"
  >
    {{outlet}}
  </div>
</template>
