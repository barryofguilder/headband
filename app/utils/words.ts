/**
 * Trims each word, drops blanks, and drops repeats. Repeats are matched
 * without regard to capitals, and the first spelling is kept.
 */
export function cleanWords(words: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of words) {
    const word = raw.trim().replace(/\s+/g, ' ');
    const key = word.toLowerCase();
    if (word && !seen.has(key)) {
      seen.add(key);
      result.push(word);
    }
  }
  return result;
}

/**
 * Splits typed or pasted text into words. Commas and new lines separate
 * words, so a pasted list adds everything at once.
 */
export function splitWords(text: string): string[] {
  return cleanWords(text.split(/[,\n\r]+/));
}
