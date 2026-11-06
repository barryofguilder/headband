import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import type Owner from '@ember/owner';
import type RouterService from '@ember/routing/router-service';
import type { Category } from 'headband/categories';
import type ClockService from 'headband/services/clock';
import type GameService from 'headband/services/game';
import type SettingsService from 'headband/services/settings';
import type WordDeckService from 'headband/services/word-deck';

/**
 * Seconds of 3-2-1 before the first word.
 */
export const COUNTDOWN_SECONDS = 3;

/**
 * How long "Correct!" or "Pass" stays up before the next word. Taps during
 * this time are ignored, so a double tap can't skip a word by accident.
 */
export const FEEDBACK_MS = 600;

const TICK_MS = 100;

type Answer = 'correct' | 'pass';

interface PlayRoundSignature {
  Args: {
    category: Category;
  };
}

/**
 * One timed round: a countdown, then words until time runs out. When the
 * round ends, the result is saved and the results screen opens.
 */
export default class PlayRound extends Component<PlayRoundSignature> {
  @service declare wordDeck: WordDeckService;
  @service declare settings: SettingsService;
  @service declare clock: ClockService;
  @service declare game: GameService;
  @service declare router: RouterService;

  @tracked now: number;
  @tracked word?: string;
  @tracked feedback?: Answer;
  @tracked correct: string[] = [];
  @tracked passed: string[] = [];

  readonly playStartsAt: number;
  readonly endsAt: number;

  #feedbackUntil = 0;
  #done = false;
  #stopTimer: () => void;

  constructor(owner: Owner, args: PlayRoundSignature['Args']) {
    super(owner, args);
    this.now = this.clock.now();
    this.playStartsAt = this.now + COUNTDOWN_SECONDS * 1000;
    this.endsAt = this.playStartsAt + this.settings.roundSeconds * 1000;
    this.#stopTimer = this.clock.every(TICK_MS, this.tick);
  }

  willDestroy(): void {
    super.willDestroy();
    this.#stopTimer();
  }

  get isCountingDown(): boolean {
    return this.now < this.playStartsAt;
  }

  get countdown(): number {
    return Math.ceil((this.playStartsAt - this.now) / 1000);
  }

  get secondsLeft(): number {
    return Math.max(0, Math.ceil((this.endsAt - this.now) / 1000));
  }

  get timeLeftLabel(): string {
    const minutes = Math.floor(this.secondsLeft / 60);
    const seconds = String(this.secondsLeft % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  get isLowOnTime(): boolean {
    return !this.isCountingDown && this.secondsLeft <= 10;
  }

  tick = (): void => {
    if (this.#done) {
      return;
    }
    this.now = this.clock.now();

    if (this.now >= this.endsAt) {
      this.#finish();
      return;
    }

    if (this.isCountingDown) {
      return;
    }

    if (this.feedback && this.now >= this.#feedbackUntil) {
      this.feedback = undefined;
    }

    if (!this.feedback && this.word === undefined) {
      this.word = this.wordDeck.draw(this.args.category);
    }
  };

  answer = (kind: Answer): void => {
    if (this.#done || this.isCountingDown || this.feedback || !this.word) {
      return;
    }

    if (kind === 'correct') {
      this.correct = [...this.correct, this.word];
    } else {
      this.passed = [...this.passed, this.word];
    }

    this.word = undefined;
    this.feedback = kind;
    this.#feedbackUntil = this.clock.now() + FEEDBACK_MS;
  };

  quit = (): void => {
    this.#done = true;
    this.#stopTimer();
    void this.router.transitionTo('play.ready', this.args.category.id);
  };

  #finish(): void {
    this.#done = true;
    this.#stopTimer();

    // A word still on screen when time runs out counts as a pass.
    const passed = this.word ? [...this.passed, this.word] : this.passed;

    this.game.lastResult = {
      categoryId: this.args.category.id,
      correct: this.correct,
      passed,
    };
    void this.router.replaceWith('play.results', this.args.category.id);
  }

  <template>
    <div
      class="bg-plum-900 fixed inset-0 z-10 flex flex-col select-none"
      data-test-round
    >
      {{#if this.isCountingDown}}
        <div
          class="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <p class="text-teal text-2xl font-semibold">{{@category.name}}</p>
          <p
            class="text-9xl font-bold tabular-nums"
            aria-live="assertive"
            data-test-countdown
          >{{this.countdown}}</p>
          <p class="text-xl text-white/80">Phone to your forehead!</p>
        </div>
      {{else}}
        <button
          type="button"
          class="flex flex-1 items-start justify-center pt-[max(env(safe-area-inset-top),1rem)] text-lg font-semibold text-white/60 active:bg-white/5"
          {{on "click" (fn this.answer "pass")}}
          data-test-pass
        >
          <span><span aria-hidden="true">↑</span> Pass</span>
        </button>
        <button
          type="button"
          class="flex flex-1 items-end justify-center pb-[max(env(safe-area-inset-bottom),1rem)] text-lg font-semibold text-white/60 active:bg-white/5"
          {{on "click" (fn this.answer "correct")}}
          data-test-correct
        >
          <span><span aria-hidden="true">↓</span> Correct</span>
        </button>

        {{! The word sits on top of both tap zones without blocking taps. }}
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
        >
          {{#if this.feedback}}
            <p
              class="flex items-center gap-3 rounded-3xl px-8 py-4 text-5xl font-bold
                {{if
                  (eq this.feedback 'correct')
                  'bg-teal text-plum-900'
                  'bg-plum-500 text-white'
                }}"
              aria-live="assertive"
              data-test-feedback={{this.feedback}}
            >
              {{#if (eq this.feedback "correct")}}
                <span aria-hidden="true">✓</span>
                Correct!
              {{else}}
                <span aria-hidden="true">↷</span>
                Pass
              {{/if}}
            </p>
          {{else if this.word}}
            <p
              class="text-center text-6xl leading-tight font-bold break-words"
              aria-live="polite"
              data-test-word
            >{{this.word}}</p>
          {{/if}}
        </div>
      {{/if}}

      <div
        class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)]"
      >
        <button
          type="button"
          class="pointer-events-auto flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white/10 px-4 font-semibold active:bg-white/20"
          {{on "click" this.quit}}
          data-test-quit
        >
          <span aria-hidden="true">✕</span>
          <span class="sr-only">End round</span>
        </button>
        {{#unless this.isCountingDown}}
          <p
            class="rounded-full px-4 py-2 text-2xl font-bold tabular-nums
              {{if
                this.isLowOnTime
                'text-plum-900 animate-pulse bg-white'
                'bg-white/10'
              }}"
            data-test-timer
          >
            <span class="sr-only">Time left:</span>
            {{this.timeLeftLabel}}
          </p>
        {{/unless}}
      </div>
    </div>
  </template>
}

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}
