/**
 * Returns the first emoji in the text, or undefined if it doesn't start
 * with one. Handles emoji made of several characters, like flags and
 * families.
 */
export function firstEmoji(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const first = segments.segment(trimmed)[Symbol.iterator]().next()
    .value?.segment;
  if (
    !first ||
    !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first)
  ) {
    return undefined;
  }
  return first;
}
