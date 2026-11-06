import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { LinkTo } from '@ember/routing';
import type { Category } from 'headband/categories';
import CategoryIcon from 'headband/components/category-icon';
import ConfirmDialog from 'headband/components/confirm-dialog';
import type CustomCategoriesService from 'headband/services/custom-categories';
import type WordDeckService from 'headband/services/word-deck';

/**
 * The player's categories, with buttons to edit or delete each one.
 */
export default class MyCategoryList extends Component {
  @service declare customCategories: CustomCategoriesService;
  @service declare wordDeck: WordDeckService;

  @tracked deleting?: Category;

  get categories(): Category[] {
    return [...this.customCategories.categories].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  askToDelete = (category: Category): void => {
    this.deleting = category;
  };

  cancelDelete = (): void => {
    this.deleting = undefined;
  };

  confirmDelete = (): void => {
    if (this.deleting) {
      this.customCategories.delete(this.deleting.id);
      this.wordDeck.forget(this.deleting.id);
    }
    this.deleting = undefined;
  };

  <template>
    <div class="flex flex-1 flex-col gap-4 pt-4">
      <LinkTo
        @route="my-categories.new"
        class="bg-teal text-plum-900 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-6 text-xl font-semibold transition-transform active:scale-95"
        data-test-new-category-button
      >
        <span aria-hidden="true">＋</span>
        New category
      </LinkTo>

      {{#if this.categories.length}}
        <ul class="sideways:grid-cols-2 grid gap-3" data-test-my-categories>
          {{#each this.categories as |category|}}
            <li
              class="bg-plum-700/60 flex items-center rounded-2xl"
              data-test-my-category={{category.id}}
            >
              <LinkTo
                @route="my-categories.edit"
                @model={{category.id}}
                class="flex min-h-16 min-w-0 flex-1 items-center gap-4 rounded-2xl p-3 pr-1 active:bg-white/10"
                data-test-edit-category
              >
                <CategoryIcon @category={{category}} class="text-4xl" />
                <span class="min-w-0">
                  <span class="block truncate text-lg font-semibold">
                    {{category.name}}
                  </span>
                  <span class="block text-base text-white/70">
                    {{wordCount category.words.length}}
                    · Tap to edit
                  </span>
                </span>
              </LinkTo>
              <button
                type="button"
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl active:bg-white/10"
                aria-label="Delete {{category.name}}"
                {{on "click" (fn this.askToDelete category)}}
                data-test-delete-category
              >
                <span aria-hidden="true">🗑️</span>
              </button>
            </li>
          {{/each}}
        </ul>
      {{else}}
        <div
          class="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"
          data-test-no-categories
        >
          <p class="text-5xl" aria-hidden="true">✏️</p>
          <p class="text-xl font-semibold">No categories yet</p>
          <p class="max-w-xs text-lg text-white/80">
            Make your own with any words you like, like inside jokes or your
            favorite shows.
          </p>
        </div>
      {{/if}}
    </div>

    {{#if this.deleting}}
      <ConfirmDialog
        @title="Delete {{this.deleting.name}}?"
        @confirmLabel="Delete"
        @onConfirm={{this.confirmDelete}}
        @onCancel={{this.cancelDelete}}
      >
        This can't be undone.
      </ConfirmDialog>
    {{/if}}
  </template>
}

function wordCount(count: number): string {
  return count === 1 ? '1 word' : `${count} words`;
}
