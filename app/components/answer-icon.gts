import type { TOC } from '@ember/component/template-only';

interface AnswerIconSignature {
  Args: {
    kind: 'correct' | 'pass';
  };
  Element: SVGSVGElement;
}

/**
 * A check for a right answer and a forward arrow for a pass. Drawn as SVG
 * so they look the same on every phone, unlike text symbols, which change
 * with the font. Sized to the text around them.
 */
const AnswerIcon: TOC<AnswerIconSignature> = <template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="inline-block size-[1em] shrink-0"
    aria-hidden="true"
    ...attributes
  >
    {{#if (isCorrect @kind)}}
      <path d="M4 12.5l5 5L20 6.5" />
    {{else}}
      <path d="M4 12h15M13 6l6 6-6 6" />
    {{/if}}
  </svg>
</template>;

function isCorrect(kind: string): boolean {
  return kind === 'correct';
}

export default AnswerIcon;
