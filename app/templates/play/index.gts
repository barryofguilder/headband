import { LinkTo } from '@ember/routing';
import type { TOC } from '@ember/component/template-only';
import ScreenHeader from 'headband/components/screen-header';
import type { Category } from 'headband/categories';

const PlayIndex: TOC<{ Args: { model: Category[] } }> = <template>
  <ScreenHeader @title="Pick a category" />

  <ul class="mt-4 grid grid-cols-2 gap-3" data-test-categories>
    {{#each @model as |category|}}
      <li>
        <LinkTo
          @route="play.ready"
          @model={{category.id}}
          class="bg-plum-700 flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center transition-transform active:scale-95"
          data-test-category={{category.id}}
        >
          <span class="text-5xl" aria-hidden="true">{{category.emoji}}</span>
          <span class="text-xl font-semibold">{{category.name}}</span>
        </LinkTo>
      </li>
    {{/each}}
  </ul>
</template>;

export default PlayIndex;
