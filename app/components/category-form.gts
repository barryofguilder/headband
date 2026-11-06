import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import { fn, hash } from '@ember/helper';
import type Owner from '@ember/owner';
import type RouterService from '@ember/routing/router-service';
import type { Category } from 'headband/categories';
import CategoryIcon from 'headband/components/category-icon';
import ConfirmDialog from 'headband/components/confirm-dialog';
import EmojiPicker from 'headband/components/emoji-picker';
import keepFocus from 'headband/modifiers/keep-focus';
import type CustomCategoriesService from 'headband/services/custom-categories';
import type WordDeckService from 'headband/services/word-deck';
import { cleanWords, splitWords } from 'headband/utils/words';

interface CategoryFormSignature {
  Args: {
    /**
     * The category to edit. Leave out to make a new one.
     */
    category?: Category;
  };
}

/**
 * The form for making or editing a custom category: a name, an optional
 * emoji, and the words.
 */
export default class CategoryForm extends Component<CategoryFormSignature> {
  @service declare customCategories: CustomCategoriesService;
  @service declare wordDeck: WordDeckService;
  @service declare router: RouterService;

  @tracked name: string;
  @tracked emoji?: string;
  @tracked words: string[];
  @tracked newWord = '';
  @tracked isPickingEmoji = false;
  @tracked isConfirmingDelete = false;
  @tracked showErrors = false;

  /**
   * Words that were already on the list the last time some were added.
   */
  @tracked skipped: string[] = [];

  constructor(owner: Owner, args: CategoryFormSignature['Args']) {
    super(owner, args);
    this.name = args.category?.name ?? '';
    this.emoji = args.category?.emoji;
    this.words = [...(args.category?.words ?? [])];
  }

  get isEditing(): boolean {
    return this.args.category !== undefined;
  }

  get nameError(): string | undefined {
    return this.name.trim() ? undefined : 'Give your category a name.';
  }

  get wordsError(): string | undefined {
    return this.words.length > 0 ? undefined : 'Add at least one word.';
  }

  /**
   * Newest first, so a word you just added shows right under the box.
   */
  get wordsNewestFirst(): string[] {
    return [...this.words].reverse();
  }

  get wordCountLabel(): string {
    return this.words.length === 1 ? '1 word' : `${this.words.length} words`;
  }

  updateName = (event: Event): void => {
    this.name = (event.target as HTMLInputElement).value;
  };

  updateNewWord = (event: Event): void => {
    this.newWord = (event.target as HTMLInputElement).value;
  };

  chooseEmoji = (emoji: string | undefined): void => {
    this.emoji = emoji;
    this.isPickingEmoji = false;
  };

  toggleEmojiPicker = (): void => {
    this.isPickingEmoji = !this.isPickingEmoji;
  };

  addNewWord = (): void => {
    this.#addWords(splitWords(this.newWord));
    this.newWord = '';
  };

  /**
   * Adds the word and puts the cursor back in the box, so the phone's
   * keyboard stays up for the next word.
   */
  onAddClick = (): void => {
    this.addNewWord();
    document.getElementById('new-word')?.focus();
  };

  onNewWordKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addNewWord();
    }
  };

  /**
   * A pasted list adds every word at once. Text boxes drop line breaks from
   * pasted text, so this splits it first.
   */
  onNewWordPaste = (event: ClipboardEvent): void => {
    const text = event.clipboardData?.getData('text') ?? '';
    if (/[,\n\r]/.test(text)) {
      event.preventDefault();
      this.#addWords(splitWords(this.newWord + text));
      this.newWord = '';
    }
  };

  removeWord = (word: string): void => {
    this.words = this.words.filter((existing) => existing !== word);
    this.skipped = [];
  };

  save = (event: SubmitEvent): void => {
    event.preventDefault();

    // A word still in the box counts, in case Add wasn't tapped.
    if (this.newWord.trim()) {
      this.addNewWord();
    }

    if (this.nameError || this.wordsError) {
      this.showErrors = true;
      return;
    }

    const draft = { name: this.name, emoji: this.emoji, words: this.words };
    if (this.args.category) {
      this.customCategories.update(this.args.category.id, draft);
    } else {
      this.customCategories.create(draft);
    }
    void this.router.transitionTo('my-categories.index');
  };

  askToDelete = (): void => {
    this.isConfirmingDelete = true;
  };

  cancelDelete = (): void => {
    this.isConfirmingDelete = false;
  };

  confirmDelete = (): void => {
    const category = this.args.category;
    if (category) {
      this.customCategories.delete(category.id);
      this.wordDeck.forget(category.id);
    }
    void this.router.transitionTo('my-categories.index');
  };

  #addWords(added: string[]): void {
    const existing = new Set(this.words.map((word) => word.toLowerCase()));
    this.skipped = added.filter((word) => existing.has(word.toLowerCase()));
    this.words = cleanWords([...this.words, ...added]);
  }

  <template>
    <form
      class="flex flex-1 flex-col gap-6 pt-4"
      novalidate
      {{on "submit" this.save}}
      data-test-category-form
    >
      <div
        class="sideways:grid sideways:grid-cols-2 sideways:items-start sideways:gap-6 flex flex-col gap-6"
      >
        <div class="flex flex-col gap-6">
          <div>
            <label for="category-name" class="mb-2 block text-lg font-semibold">
              Name
            </label>
            <input
              id="category-name"
              type="text"
              maxlength="40"
              autocomplete="off"
              autocapitalize="words"
              enterkeyhint="next"
              placeholder="Like “Movies” or “Our Family”"
              value={{this.name}}
              class="focus:border-teal min-h-14 w-full rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg placeholder:text-white/50 focus:outline-none"
              aria-invalid={{if
                (and this.showErrors this.nameError)
                "true"
                "false"
              }}
              aria-describedby={{if
                (and this.showErrors this.nameError)
                "category-name-error"
              }}
              {{on "input" this.updateName}}
              data-test-category-name
            />
            {{#if (and this.showErrors this.nameError)}}
              <p
                id="category-name-error"
                class="mt-2 text-base font-medium"
                role="alert"
                data-test-name-error
              >
                <span aria-hidden="true">⚠️</span>
                {{this.nameError}}
              </p>
            {{/if}}
          </div>

          <div>
            <p class="mb-2 text-lg font-semibold" id="category-icon-label">
              Icon
              <span
                class="text-base font-normal text-white/70"
              >(optional)</span>
            </p>
            <div class="flex items-center gap-4">
              <CategoryIcon
                @category={{hash emoji=this.emoji}}
                class="text-6xl"
                data-test-icon-preview
              />
              <button
                type="button"
                class="min-h-12 rounded-xl bg-white/15 px-5 text-lg font-semibold active:bg-white/25"
                aria-expanded={{if this.isPickingEmoji "true" "false"}}
                aria-describedby="category-icon-label"
                {{on "click" this.toggleEmojiPicker}}
                data-test-change-icon
              >
                {{if this.isPickingEmoji "Done" "Change"}}
              </button>
            </div>
            {{#if this.isPickingEmoji}}
              <div class="mt-4">
                <EmojiPicker
                  @selected={{this.emoji}}
                  @onSelect={{this.chooseEmoji}}
                />
              </div>
            {{/if}}
          </div>
        </div>

        <div>
          <label for="new-word" class="mb-2 block text-lg font-semibold">
            Words
            <span
              class="text-base font-normal text-white/70"
              data-test-word-count
            >({{this.wordCountLabel}})</span>
          </label>
          <div class="flex gap-2">
            <input
              id="new-word"
              type="text"
              autocomplete="off"
              autocapitalize="words"
              enterkeyhint="enter"
              placeholder="Type a word"
              value={{this.newWord}}
              class="focus:border-teal min-h-14 min-w-0 flex-1 rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg placeholder:text-white/50 focus:outline-none"
              aria-describedby="new-word-hint"
              {{on "input" this.updateNewWord}}
              {{on "keydown" this.onNewWordKeydown}}
              {{on "paste" this.onNewWordPaste}}
              data-test-new-word
            />
            <button
              type="button"
              class="bg-teal text-plum-900 min-h-14 rounded-2xl px-5 text-lg font-semibold active:scale-95"
              {{keepFocus}}
              {{on "click" this.onAddClick}}
              data-test-add-word
            >
              Add
            </button>
          </div>
          <p id="new-word-hint" class="mt-2 text-base text-white/70">
            Tip: paste a list with commas or one word per line to add them all.
          </p>

          <div aria-live="polite">
            {{#if this.skipped.length}}
              <p class="mt-2 text-base font-medium" data-test-skipped>
                Already on the list:
                {{join this.skipped}}
              </p>
            {{/if}}
            {{#if (and this.showErrors this.wordsError)}}
              <p
                class="mt-2 text-base font-medium"
                role="alert"
                data-test-words-error
              >
                <span aria-hidden="true">⚠️</span>
                {{this.wordsError}}
              </p>
            {{/if}}
          </div>

          {{#if this.words.length}}
            <ul class="mt-4 flex flex-wrap gap-2" data-test-words>
              {{#each this.wordsNewestFirst as |word|}}
                <li
                  class="flex min-h-11 items-center gap-1 rounded-full bg-white/10 pl-4"
                  data-test-word-item
                >
                  <span>{{word}}</span>
                  <button
                    type="button"
                    class="flex size-11 items-center justify-center rounded-full text-xl text-white/70 active:bg-white/15"
                    aria-label="Remove {{word}}"
                    {{on "click" (fn this.removeWord word)}}
                    data-test-remove-word={{word}}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </li>
              {{/each}}
            </ul>
          {{/if}}
        </div>
      </div>

      <div class="mt-auto flex flex-col gap-3 pt-2">
        <button
          type="submit"
          class="bg-teal text-plum-900 flex min-h-16 w-full items-center justify-center rounded-2xl px-6 text-xl font-semibold transition-transform active:scale-95"
          data-test-save
        >
          {{if this.isEditing "Save changes" "Save category"}}
        </button>
        {{#if this.isEditing}}
          <button
            type="button"
            class="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-white/30 px-6 text-lg font-semibold active:bg-white/10"
            {{on "click" this.askToDelete}}
            data-test-delete
          >
            Delete category
          </button>
        {{/if}}
      </div>
    </form>

    {{#if this.isConfirmingDelete}}
      <ConfirmDialog
        @title="Delete {{@category.name}}?"
        @confirmLabel="Delete"
        @onConfirm={{this.confirmDelete}}
        @onCancel={{this.cancelDelete}}
      >
        This can't be undone.
      </ConfirmDialog>
    {{/if}}
  </template>
}

function and(a: unknown, b: unknown): boolean {
  return Boolean(a) && Boolean(b);
}

function join(words: string[]): string {
  return words.join(', ');
}
