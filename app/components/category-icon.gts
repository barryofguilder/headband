import type { TOC } from '@ember/component/template-only';
import type { Category } from 'headband/categories';

interface CategoryIconSignature {
  Args: {
    category: Pick<Category, 'emoji'>;
  };
  Element: HTMLSpanElement;
}

/**
 * The category's emoji, or the Headband logo when it doesn't have one.
 * Size it with a text size class, like `text-5xl`.
 */
const CategoryIcon: TOC<CategoryIconSignature> = <template>
  <span
    class="inline-flex items-center justify-center leading-none"
    aria-hidden="true"
    ...attributes
  >
    {{#if @category.emoji}}
      {{@category.emoji}}
    {{else}}
      <img
        src="/logo.svg"
        alt=""
        class="size-[1.1em] rounded-[0.2em] ring-2 ring-white/25"
        data-test-default-icon
      />
    {{/if}}
  </span>
</template>;

export default CategoryIcon;
