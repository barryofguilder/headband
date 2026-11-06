import { LinkTo } from '@ember/routing';
import type { TOC } from '@ember/component/template-only';
import { pageTitle } from 'ember-page-title';
import type { ResultsModel } from 'headband/routes/play/results';

const buttonClass =
  'flex min-h-16 sideways:min-h-13 w-full items-center justify-center gap-3 rounded-2xl px-6 text-xl font-semibold transition-transform active:scale-95';

const PlayResults: TOC<{ Args: { model: ResultsModel } }> = <template>
  {{pageTitle "Results"}}

  <section
    class="sideways:grid sideways:grid-cols-2 sideways:grid-rows-[auto_1fr] sideways:gap-x-8 sideways:gap-y-4 sideways:pt-0 flex flex-1 flex-col gap-6 pt-4"
  >
    <header
      class="sideways:col-start-1 sideways:row-start-1 flex flex-col items-center gap-1 text-center"
    >
      <p class="text-lg text-white/80">
        <span aria-hidden="true">{{@model.category.emoji}}</span>
        {{@model.category.name}}
      </p>
      <h1
        class="text-teal sideways:text-5xl text-6xl font-bold tabular-nums"
        data-test-score
      >
        {{@model.result.correct.length}}
      </h1>
      <p class="text-2xl font-semibold">correct</p>
    </header>

    <div
      class="sideways:col-start-2 sideways:row-span-2 sideways:row-start-1 sideways:content-start grid gap-4"
    >
      <section class="bg-plum-700/60 rounded-2xl p-4" data-test-correct-list>
        <h2 class="mb-2 text-lg font-semibold">
          <span aria-hidden="true">✓</span>
          Got it ({{@model.result.correct.length}})
        </h2>
        {{#if @model.result.correct.length}}
          <ul class="flex flex-wrap gap-2">
            {{#each @model.result.correct as |word|}}
              <li
                class="bg-teal text-plum-900 rounded-full px-3 py-1 font-medium"
              >{{word}}</li>
            {{/each}}
          </ul>
        {{else}}
          <p class="text-white/70">None this time.</p>
        {{/if}}
      </section>

      <section class="bg-plum-700/60 rounded-2xl p-4" data-test-passed-list>
        <h2 class="mb-2 text-lg font-semibold">
          <span aria-hidden="true">↷</span>
          Passed ({{@model.result.passed.length}})
        </h2>
        {{#if @model.result.passed.length}}
          <ul class="flex flex-wrap gap-2">
            {{#each @model.result.passed as |word|}}
              <li
                class="rounded-full border border-white/40 px-3 py-1 font-medium"
              >{{word}}</li>
            {{/each}}
          </ul>
        {{else}}
          <p class="text-white/70">None. Nice!</p>
        {{/if}}
      </section>
    </div>

    <nav
      class="sideways:col-start-1 sideways:row-start-2 sideways:justify-end sideways:gap-2 mt-auto flex flex-col gap-3"
      aria-label="What next"
    >
      <LinkTo
        @route="play.round"
        @model={{@model.category.id}}
        class="{{buttonClass}} bg-teal text-plum-900"
        data-test-play-again
      >
        Play again
      </LinkTo>
      <LinkTo
        @route="play.index"
        class="{{buttonClass}} bg-plum-700 text-white"
        data-test-new-category
      >
        New category
      </LinkTo>
      <LinkTo
        @route="index"
        class="{{buttonClass}} bg-plum-700 text-white"
        data-test-home
      >
        Home
      </LinkTo>
    </nav>
  </section>
</template>;

export default PlayResults;
