import { LinkTo } from '@ember/routing';
import type { TOC } from '@ember/component/template-only';
import ScreenHeader from 'headband/components/screen-header';
import RoundLengthPicker from 'headband/components/round-length-picker';
import type { Category } from 'headband/categories';

const PlayReady: TOC<{ Args: { model: Category } }> = <template>
  <ScreenHeader @title="Get ready" @backTo="play.index" />

  <section class="flex flex-1 flex-col gap-8 pt-6">
    <div class="flex flex-col items-center gap-2 text-center">
      <span class="text-7xl" aria-hidden="true">{{@model.emoji}}</span>
      <h2
        class="text-3xl font-bold"
        data-test-ready-category
      >{{@model.name}}</h2>
    </div>

    <RoundLengthPicker />

    <p class="bg-plum-700/60 rounded-2xl p-4 text-lg text-white/90">
      Hold the phone to your forehead with the screen facing out. Tap the bottom
      half when you get it, and the top half to pass.
    </p>

    <LinkTo
      @route="play.round"
      @model={{@model.id}}
      class="bg-teal text-plum-900 mt-auto flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-6 text-xl font-semibold transition-transform active:scale-95"
      data-test-start
    >
      <span aria-hidden="true">▶</span>
      Start
    </LinkTo>
  </section>
</template>;

export default PlayReady;
