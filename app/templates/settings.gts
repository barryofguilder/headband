import ScreenHeader from 'headband/components/screen-header';
import RoundLengthPicker from 'headband/components/round-length-picker';
import TapToAnswerSetting from 'headband/components/tap-to-answer-setting';

<template>
  <ScreenHeader @title="Settings" />

  <div
    class="sideways:grid sideways:grid-cols-2 sideways:items-start mt-4 flex flex-col gap-4"
  >
    <section class="bg-plum-700/60 rounded-2xl p-4" data-test-settings-round>
      <RoundLengthPicker />
      <p class="mt-3 text-center text-base text-white/80">
        You can also change this on the Get ready screen.
      </p>
    </section>

    <TapToAnswerSetting />
  </div>
</template>
