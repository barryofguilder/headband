export interface Category {
  /**
   * Stable id, used to remember which words have been played. Never change it once shipped.
   */
  id: string;
  name: string;
  /**
   * Shown on the category card. Built-in categories always have one. Custom
   * categories can leave it out and get the default icon.
   */
  emoji?: string;
  words: string[];
  /**
   * True for categories the player made.
   */
  isCustom?: boolean;
}
