import type { TOC } from '@ember/component/template-only';
import ScreenHeader from 'headband/components/screen-header';
import CategoryIcon from 'headband/components/category-icon';
import RoundLengthPicker from 'headband/components/round-length-picker';
import StartRoundButton from 'headband/components/start-round-button';
import type { Category } from 'headband/categories';

/**
 * Upright, everything stacks: category, round length, tips, Start.
 *
 * Sideways, there are two columns. The left is one card with the category
 * and tips. The right has the round length on top and Start at the bottom.
 * The column wrappers use `contents` when upright so they don't affect the
 * stack, and `order` keeps the upright order the same.
 */
const PlayReady: TOC<{ Args: { model: Category } }> = <template>
  <ScreenHeader @title="Get ready" @backTo="play.index" />

  <section
    class="sideways:grid sideways:grid-cols-2 sideways:gap-6 sideways:pt-1 flex flex-1 flex-col gap-6 pt-6"
  >
    <div
      class="sideways:flex sideways:flex-col sideways:items-center sideways:justify-center sideways:gap-3 sideways:rounded-3xl sideways:bg-plum-700/60 sideways:p-5 contents"
    >
      <div class="order-1 flex flex-col items-center gap-2 text-center">
        <CategoryIcon @category={{@model}} class="sideways:text-6xl text-7xl" />
        <h2 class="text-3xl font-bold" data-test-ready-category>
          {{@model.name}}
        </h2>
      </div>

      <p
        class="bg-plum-700/60 sideways:bg-transparent sideways:p-0 sideways:text-center sideways:text-base order-3 rounded-2xl p-4 text-lg text-white/90"
      >
        Turn your phone sideways and hold it to your forehead, screen facing
        out. Tilt down when you get it, and tilt up to pass.
      </p>
    </div>

    <div
      class="sideways:flex sideways:flex-col sideways:justify-between sideways:gap-4 contents"
    >
      <div class="order-2">
        <RoundLengthPicker />
      </div>

      <div class="order-4 mt-auto flex flex-col gap-4">
        <StartRoundButton @category={{@model}} />
      </div>
    </div>
  </section>
</template>;

export default PlayReady;
