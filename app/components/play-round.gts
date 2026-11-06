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
import type OrientationService from 'headband/services/orientation';
import type SettingsService from 'headband/services/settings';
import type TiltService from 'headband/services/tilt';
import type { TiltDirection } from 'headband/services/tilt';
import type WordDeckService from 'headband/services/word-deck';
import { keepScreenOn } from 'headband/utils/wake-lock';

/**
 * Seconds of 3-2-1 before the first word.
 */
export const COUNTDOWN_SECONDS = 3;

/**
 * How long "Correct!" or "Pass" stays up before the next word. Taps and tilts
 * during this time are ignored, so one answer can't skip a word by accident.
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
 * One timed round. It waits until the phone is sideways, counts down, then
 * shows words until time runs out. Tilt down or tap the bottom half for a
 * right answer. Tilt up or tap the top half to pass. When the round ends,
 * the result is saved and the results screen opens.
 */
export default class PlayRound extends Component<PlayRoundSignature> {
  @service declare wordDeck: WordDeckService;
  @service declare settings: SettingsService;
  @service declare clock: ClockService;
  @service declare game: GameService;
  @service declare router: RouterService;
  @service declare tilt: TiltService;
  @service declare orientation: OrientationService;

  @tracked now: number;
  @tracked word?: string;
  @tracked feedback?: Answer;
  @tracked correct: string[] = [];
  @tracked passed: string[] = [];

  /**
   * When the first word shows. Not set until the phone is sideways.
   */
  @tracked playStartsAt?: number;
  endsAt?: number;

  #feedbackUntil = 0;
  #done = false;
  #cleanups: (() => void)[] = [];

  constructor(owner: Owner, args: PlayRoundSignature['Args']) {
    super(owner, args);
    this.now = this.clock.now();

    this.orientation.lockLandscape();
    this.#cleanups.push(
      this.clock.every(TICK_MS, this.tick),
      this.tilt.listen(this.onTilt),
      keepScreenOn(),
      () => this.orientation.unlock(),
    );

    this.#startIfSideways();
  }

  willDestroy(): void {
    super.willDestroy();
    this.#cleanUp();
  }

  get isWaitingForLandscape(): boolean {
    return this.playStartsAt === undefined;
  }

  get isCountingDown(): boolean {
    return this.playStartsAt !== undefined && this.now < this.playStartsAt;
  }

  get isPlaying(): boolean {
    return this.playStartsAt !== undefined && this.now >= this.playStartsAt;
  }

  get countdown(): number {
    return Math.ceil(((this.playStartsAt ?? this.now) - this.now) / 1000);
  }

  get secondsLeft(): number {
    const endsAt = this.endsAt ?? this.now;
    return Math.max(0, Math.ceil((endsAt - this.now) / 1000));
  }

  get timeLeftLabel(): string {
    const minutes = Math.floor(this.secondsLeft / 60);
    const seconds = String(this.secondsLeft % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  get isLowOnTime(): boolean {
    return this.isPlaying && this.secondsLeft <= 10;
  }

  tick = (): void => {
    if (this.#done) {
      return;
    }
    this.now = this.clock.now();

    if (this.isWaitingForLandscape) {
      this.#startIfSideways();
      return;
    }

    if (this.endsAt !== undefined && this.now >= this.endsAt) {
      this.#finish();
      return;
    }

    if (!this.isPlaying) {
      return;
    }

    if (this.feedback && this.now >= this.#feedbackUntil) {
      this.feedback = undefined;
    }

    if (!this.feedback && this.word === undefined) {
      this.word = this.wordDeck.draw(this.args.category);
    }
  };

  onTilt = (direction: TiltDirection): void => {
    this.answer(direction === 'down' ? 'correct' : 'pass');
  };

  answer = (kind: Answer): void => {
    if (this.#done || !this.isPlaying || this.feedback || !this.word) {
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
    this.#cleanUp();
    void this.router.transitionTo('play.ready', this.args.category.id);
  };

  #startIfSideways(): void {
    // The round only starts sideways. Once it has started, turning the phone
    // doesn't pause it, since tilting can briefly look like a turn.
    if (!this.orientation.isLandscape) {
      return;
    }
    this.playStartsAt = this.now + COUNTDOWN_SECONDS * 1000;
    this.endsAt = this.playStartsAt + this.settings.roundSeconds * 1000;
  }

  #finish(): void {
    this.#done = true;
    this.#cleanUp();

    // A word still on screen when time runs out counts as a pass.
    const passed = this.word ? [...this.passed, this.word] : this.passed;

    this.game.lastResult = {
      categoryId: this.args.category.id,
      correct: this.correct,
      passed,
    };
    void this.router.replaceWith('play.results', this.args.category.id);
  }

  #cleanUp(): void {
    for (const cleanup of this.#cleanups.splice(0)) {
      cleanup();
    }
  }

  <template>
    <div
      class="bg-plum-900 fixed inset-0 z-10 flex flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] select-none"
      data-test-round
    >
      {{#if this.isWaitingForLandscape}}
        <div
          class="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
          data-test-turn-sideways
        >
          <span class="animate-turn text-8xl" aria-hidden="true">📱</span>
          <p class="text-3xl font-bold" aria-live="polite">
            Turn your phone sideways
          </p>
          <p class="text-lg text-white/80">
            The countdown starts when it's sideways.
          </p>
        </div>
      {{else if this.isCountingDown}}
        <div
          class="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center"
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
          class="flex flex-1 items-start justify-center pt-[max(env(safe-area-inset-top),0.75rem)] text-lg font-semibold text-white/60 active:bg-white/5"
          {{on "click" (fn this.answer "pass")}}
          data-test-pass
        >
          <span><span aria-hidden="true">↑</span> Pass</span>
        </button>
        <button
          type="button"
          class="flex flex-1 items-end justify-center pb-[max(env(safe-area-inset-bottom),0.75rem)] text-lg font-semibold text-white/60 active:bg-white/5"
          {{on "click" (fn this.answer "correct")}}
          data-test-correct
        >
          <span><span aria-hidden="true">↓</span> Correct</span>
        </button>

        {{! The word sits on top of both tap zones without blocking taps. }}
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center px-16"
        >
          {{#if this.feedback}}
            <p
              class="flex items-center gap-3 rounded-3xl px-8 py-4 text-6xl font-bold
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
              class="text-center text-7xl leading-tight font-bold break-words"
              aria-live="polite"
              data-test-word
            >{{this.word}}</p>
          {{/if}}
        </div>
      {{/if}}

      <div
        class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between pt-[max(env(safe-area-inset-top),0.75rem)] pr-[max(env(safe-area-inset-right),1rem)] pl-[max(env(safe-area-inset-left),1rem)]"
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
        {{#if this.isPlaying}}
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
        {{/if}}
      </div>
    </div>
  </template>
}

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}
