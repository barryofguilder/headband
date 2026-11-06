import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { firstEmoji } from 'headband/utils/emoji';

/**
 * Emoji to choose from. Any other emoji can be typed in.
 */
export const EMOJI_CHOICES = [
  '👶',
  '🧒',
  '👧',
  '👦',
  '👩',
  '👨',
  '👵',
  '👴',
  '👪',
  '💑',
  '🧑‍🍳',
  '🧑‍⚕️',
  '🧑‍🚀',
  '🧑‍🎤',
  '🧑‍🏫',
  '🧑‍🚒',
  '👮',
  '🕵️',
  '🤴',
  '👸',
  '🦸',
  '🧙',
  '🧛',
  '🧜',
  '🧚',
  '🤠',
  '🥷',
  '🤡',
  '💃',
  '🕺',
  '🎬',
  '📺',
  '🎵',
  '🎤',
  '🎸',
  '🎮',
  '📚',
  '🎨',
  '🎭',
  '🎲',
  '🧩',
  '🎯',
  '🍕',
  '🍔',
  '🌮',
  '🍦',
  '🍩',
  '🍎',
  '☕',
  '🍿',
  '🍣',
  '🍝',
  '🧁',
  '🥤',
  '🐶',
  '🐱',
  '🦁',
  '🐠',
  '🦄',
  '🐉',
  '🦋',
  '🐸',
  '🌳',
  '🌸',
  '🌎',
  '🌈',
  '⚽',
  '🏀',
  '⚾',
  '🏈',
  '🎾',
  '🏒',
  '⛳',
  '🏊',
  '🚴',
  '🥊',
  '🛹',
  '🏆',
  '🚗',
  '✈️',
  '🚀',
  '🏖️',
  '🏠',
  '🏰',
  '🗽',
  '🏕️',
  '🚂',
  '🚢',
  '🗺️',
  '🏙️',
  '🎄',
  '🎃',
  '🎂',
  '🎉',
  '💝',
  '🐰',
  '🎆',
  '🦃',
  '🍀',
  '🎁',
  '🕎',
  '🪔',
  '👑',
  '👻',
  '🤖',
  '👽',
  '💼',
  '❤️',
  '⭐',
  '🔥',
  '💡',
  '🧠',
  '💎',
  '❓',
];

interface EmojiPickerSignature {
  Args: {
    selected?: string;
    onSelect: (emoji: string | undefined) => void;
  };
}

/**
 * A grid of emoji, a "None" choice for the default icon, and a box for
 * typing any other emoji.
 */
export default class EmojiPicker extends Component<EmojiPickerSignature> {
  choices = EMOJI_CHOICES;

  @tracked typed = '';
  @tracked typedError = false;

  isSelected = (emoji: string | undefined): boolean =>
    this.args.selected === emoji;

  updateTyped = (event: Event): void => {
    this.typed = (event.target as HTMLInputElement).value;
    this.typedError = false;
  };

  useTyped = (event?: Event): void => {
    event?.preventDefault();
    const emoji = firstEmoji(this.typed);
    if (emoji) {
      this.args.onSelect(emoji);
      this.typed = '';
    } else {
      this.typedError = true;
    }
  };

  onTypedKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.useTyped(event);
    }
  };

  <template>
    <div class="flex flex-col gap-4">
      <div
        class="sideways:grid-cols-8 grid grid-cols-6 gap-2"
        role="radiogroup"
        aria-label="Icon"
      >
        <button
          type="button"
          role="radio"
          aria-checked={{if (this.isSelected undefined) "true" "false"}}
          class="flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-3xl
            {{if
              (this.isSelected undefined)
              'border-teal bg-white/15'
              'border-transparent bg-white/5'
            }}"
          {{on "click" (fn @onSelect undefined)}}
          data-test-emoji-none
        >
          <span
            class="size-8 rounded-md bg-[url(/logo.svg)] bg-cover"
            data-test-default-icon
          ></span>
          <span class="mt-0.5 text-xs font-medium">None</span>
        </button>
        {{#each this.choices as |emoji|}}
          <button
            type="button"
            role="radio"
            aria-checked={{if (this.isSelected emoji) "true" "false"}}
            aria-label={{emoji}}
            class="flex aspect-square items-center justify-center rounded-xl border-2 text-3xl
              {{if
                (this.isSelected emoji)
                'border-teal bg-white/15'
                'border-transparent bg-white/5'
              }}"
            {{on "click" (fn @onSelect emoji)}}
            data-test-emoji={{emoji}}
          >
            {{emoji}}
          </button>
        {{/each}}
      </div>

      <div>
        <label for="custom-emoji" class="mb-1 block text-base text-white/80">
          Or type any emoji
        </label>
        <div class="flex gap-2">
          <input
            id="custom-emoji"
            type="text"
            inputmode="text"
            autocomplete="off"
            enterkeyhint="done"
            value={{this.typed}}
            class="focus:border-teal min-h-12 w-24 rounded-xl border-2 border-white/20 bg-white/10 px-3 text-center text-2xl focus:outline-none"
            aria-invalid={{if this.typedError "true" "false"}}
            aria-describedby={{if this.typedError "custom-emoji-error"}}
            {{on "input" this.updateTyped}}
            {{on "keydown" this.onTypedKeydown}}
            data-test-custom-emoji
          />
          <button
            type="button"
            class="min-h-12 rounded-xl bg-white/15 px-5 text-lg font-semibold active:bg-white/25"
            {{on "click" this.useTyped}}
            data-test-use-custom-emoji
          >
            Use
          </button>
        </div>
        {{#if this.typedError}}
          <p
            id="custom-emoji-error"
            class="mt-1 text-base text-white"
            role="alert"
            data-test-custom-emoji-error
          >
            <span aria-hidden="true">⚠️</span>
            That's not an emoji. Try one from your emoji keyboard.
          </p>
        {{/if}}
      </div>
    </div>
  </template>
}
