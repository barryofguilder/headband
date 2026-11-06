import { LinkTo } from '@ember/routing';
import type { TOC } from '@ember/component/template-only';
import ScreenHeader from 'headband/components/screen-header';
import CategoryIcon from 'headband/components/category-icon';
import type { Category } from 'headband/categories';

const PlayIndex: TOC<{ Args: { model: Category[] } }> = <template>
  <ScreenHeader @title="Pick a category" />

  <ul
    class="sideways:grid-cols-4 mt-4 grid grid-cols-2 gap-3"
    data-test-categories
  >
    {{#each @model as |category|}}
      <li>
        <LinkTo
          @route="play.ready"
          @model={{category.id}}
          class="bg-plum-700 relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center transition-transform active:scale-95"
          data-test-category={{category.id}}
        >
          {{#if category.isCustom}}
            <span
              class="bg-teal text-plum-900 absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold"
              data-test-mine
            >Mine</span>
          {{/if}}
          <CategoryIcon @category={{category}} class="text-5xl" />
          <span
            class="text-xl font-semibold break-words"
          >{{category.name}}</span>
        </LinkTo>
      </li>
    {{/each}}
    <li>
      <LinkTo
        @route="my-categories.new"
        class="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/30 p-4 text-center transition-transform active:scale-95"
        data-test-make-your-own
      >
        <span class="text-5xl" aria-hidden="true">＋</span>
        <span class="text-xl font-semibold">Make your own</span>
      </LinkTo>
    </li>
  </ul>
</template>;

export default PlayIndex;
