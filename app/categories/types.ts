export interface Category {
  /**
   * Stable id, used to remember which words have been played. Never change it once shipped.
   */
  id: string;
  name: string;
  /**
   * Shown on the category card.
   */
  emoji: string;
  words: string[];
}
