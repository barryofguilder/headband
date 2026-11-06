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
import type { ContentRotation, TiltDirection } from 'headband/services/tilt';
import type WordDeckService from 'headband/services/word-deck';
import { keepScreenOn } from 'headband/utils/wake-lock';
import AnswerIcon from 'headband/components/answer-icon';

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

/**
 * How long the phone has to be held sideways with the screen still upright
 * before the round draws itself sideways. This gives the screen time to
 * rotate on its own when rotation lock is off.
 */
export const ROTATION_LOCK_GRACE_MS = 1000;

/**
 * Layouts for the round. When the screen didn't rotate, the round is drawn
 * sideways inside the upright screen.
 */
const LAYOUT_CLASSES = {
  normal:
    'absolute inset-0 flex flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]',
  '90': 'absolute top-1/2 left-1/2 flex h-[100dvw] w-[100dvh] -translate-1/2 rotate-90 flex-col',
  '-90':
    'absolute top-1/2 left-1/2 flex h-[100dvw] w-[100dvh] -translate-1/2 -rotate-90 flex-col',
} as const;

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

  /**
   * Set when the phone is sideways but the screen didn't rotate, so the
   * round is drawn sideways instead.
   */
  @tracked rotation?: ContentRotation;

  #sideways?: ContentRotation;
  #sidewaysSince = 0;
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
      this.tilt.watchSideways(this.onSideways),
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

  get layoutClass(): string {
    // If the screen does rotate later, go back to the normal layout.
    if (this.rotation === undefined || this.orientation.isLandscape) {
      return LAYOUT_CLASSES.normal;
    }
    return LAYOUT_CLASSES[this.rotation];
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

  onSideways = (rotation: ContentRotation | undefined): void => {
    this.#sideways = rotation;
    this.#sidewaysSince = this.clock.now();
  };

  /**
   * For when the screen won't rotate and there's no motion sensor to notice.
   * Starts the round upright.
   */
  playWithoutTurning = (): void => {
    if (this.isWaitingForLandscape) {
      this.#start();
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
    if (this.orientation.isLandscape) {
      this.#start();
      return;
    }

    // The phone is sideways but the screen hasn't rotated, so rotation lock
    // is probably on. Draw the round sideways instead.
    const sidewaysFor = this.now - this.#sidewaysSince;
    if (this.#sideways !== undefined && sidewaysFor >= ROTATION_LOCK_GRACE_MS) {
      this.rotation = this.#sideways;
      this.#start();
    }
  }

  #start(): void {
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
      class="bg-plum-900 fixed inset-0 z-10 overscroll-none select-none"
      data-test-round
    >
      <div
        class={{this.layoutClass}}
        data-test-round-layout={{if this.rotation this.rotation "normal"}}
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
            <button
              type="button"
              class="mt-4 min-h-12 rounded-2xl border border-white/30 px-5 text-lg font-medium text-white/90 active:bg-white/10"
              {{on "click" this.playWithoutTurning}}
              data-test-play-without-turning
            >
              Screen won't turn? Play without turning
            </button>
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
              {{! A quick wash of color across the whole screen, easy to see
                  from across the room. Off when Reduce Motion is on. }}
              <div
                class="motion-safe:animate-wash absolute inset-0 opacity-0
                  {{if (eq this.feedback 'correct') 'bg-teal' 'bg-plum-500'}}"
                aria-hidden="true"
              ></div>
              <p
                class="motion-safe:animate-feedback relative flex items-center gap-3 rounded-3xl px-8 py-4 text-6xl font-bold
                  {{if
                    (eq this.feedback 'correct')
                    'bg-teal text-plum-900'
                    'bg-plum-500 text-white'
                  }}"
                aria-live="assertive"
                data-test-feedback={{this.feedback}}
              >
                {{#if (eq this.feedback "correct")}}
                  <AnswerIcon @kind="correct" />
                  Correct!
                {{else}}
                  <AnswerIcon @kind="pass" />
                  Pass
                {{/if}}
              </p>
            {{else if this.word}}
              <p
                class="motion-safe:animate-word-in text-center text-7xl leading-tight font-bold break-words"
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
    </div>
  </template>
}

function eq(a: unknown, b: unknown): boolean {
  return a === b;
}
