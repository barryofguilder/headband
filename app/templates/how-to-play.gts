import ScreenHeader from 'headband/components/screen-header';

const steps = [
  {
    title: 'Pick a category',
    text: 'Choose one, like Animals or Sports. You can also make your own.',
  },
  {
    title: 'Turn your phone sideways',
    text: 'Hold it up to your forehead with the screen facing out. Don’t peek!',
  },
  {
    title: 'Your friends give clues',
    text: 'They can describe the word, act it out, or make sounds. They just can’t say the word.',
  },
  {
    title: 'Got it? Tilt down',
    text: 'Tip the phone down toward the floor when you guess right.',
  },
  {
    title: 'Stuck? Tilt up',
    text: 'Tip the phone up toward the ceiling to pass and get a new word.',
  },
  {
    title: 'Beat the clock',
    text: 'Get as many as you can before time runs out. Rounds are 60 seconds unless you change it.',
  },
];

<template>
  <ScreenHeader @title="How to play" />

  <ol class="mt-4 flex flex-col gap-3" data-test-how-to-play>
    {{#each steps as |step index|}}
      <li class="bg-plum-700/60 flex gap-4 rounded-2xl p-4">
        <span
          class="bg-teal text-plum-900 flex size-9 shrink-0 items-center justify-center rounded-full font-bold"
          aria-hidden="true"
        >{{add index 1}}</span>
        <div>
          <h2 class="text-lg font-semibold">{{step.title}}</h2>
          <p class="mt-1 text-white/80">{{step.text}}</p>
        </div>
      </li>
    {{/each}}
  </ol>

  <div class="border-teal/40 mt-6 rounded-2xl border p-4">
    <h2 class="text-teal text-lg font-semibold">No sensor? No problem.</h2>
    <p class="mt-1 text-white/80">
      You can also tap. Tap the bottom half of the screen for a right answer,
      and the top half to pass.
    </p>
  </div>

  <div class="border-teal/40 mt-6 rounded-2xl border p-4">
    <h2 class="text-teal text-lg font-semibold">At the end</h2>
    <p class="mt-1 text-white/80">
      You’ll see your score, the words you got, and the words you passed. If
      time runs out while a word is up, it counts as a pass.
    </p>
  </div>
</template>

function add(a: number, b: number): number {
  return a + b;
}
