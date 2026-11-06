import type { TOC } from '@ember/component/template-only';
import ScreenHeader from 'headband/components/screen-header';
import RoundLengthPicker from 'headband/components/round-length-picker';
import StartRoundButton from 'headband/components/start-round-button';
import type { Category } from 'headband/categories';

const PlayReady: TOC<{ Args: { model: Category } }> = <template>
  <ScreenHeader @title="Get ready" @backTo="play.index" />

  <section class="flex flex-1 flex-col gap-6 pt-6">
    <div class="flex flex-col items-center gap-2 text-center">
      <span class="text-7xl" aria-hidden="true">{{@model.emoji}}</span>
      <h2 class="text-3xl font-bold" data-test-ready-category>
        {{@model.name}}
      </h2>
    </div>

    <RoundLengthPicker />

    <p class="bg-plum-700/60 rounded-2xl p-4 text-lg text-white/90">
      Turn your phone sideways and hold it to your forehead, screen facing out.
      Tilt down when you get it, and tilt up to pass.
    </p>

    <StartRoundButton @category={{@model}} />
  </section>
</template>;

export default PlayReady;
