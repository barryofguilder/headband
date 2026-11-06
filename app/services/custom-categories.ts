import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type { Category } from 'headband/categories';
import { readJSON, writeJSON } from 'headband/utils/storage';
import { cleanWords } from 'headband/utils/words';

const STORAGE_KEY = 'custom-categories';

/**
 * What the player fills in when making or editing a category.
 */
export interface CategoryDraft {
  name: string;
  emoji?: string;
  words: string[];
}

/**
 * Categories the player made, saved on this device.
 */
export default class CustomCategoriesService extends Service {
  @tracked categories: Category[] = load();

  find(id: string): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  create(draft: CategoryDraft): Category {
    const category = toCategory(newId(), draft);
    this.#save([...this.categories, category]);
    return category;
  }

  update(id: string, draft: CategoryDraft): void {
    this.#save(
      this.categories.map((category) =>
        category.id === id ? toCategory(id, draft) : category,
      ),
    );
  }

  delete(id: string): void {
    this.#save(this.categories.filter((category) => category.id !== id));
  }

  #save(categories: Category[]): void {
    this.categories = categories;
    writeJSON(
      STORAGE_KEY,
      categories.map(({ id, name, emoji, words }) => ({
        id,
        name,
        emoji,
        words,
      })),
    );
  }
}

function toCategory(id: string, draft: CategoryDraft): Category {
  const emoji = draft.emoji?.trim();
  return {
    id,
    name: draft.name.trim(),
    ...(emoji ? { emoji } : {}),
    words: cleanWords(draft.words),
    isCustom: true,
  };
}

/**
 * A unique id. `crypto.randomUUID` only works on HTTPS, so there's a
 * fallback for testing over plain HTTP.
 */
function newId(): string {
  const random =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `custom-${random}`;
}

/**
 * Reads saved categories, skipping anything that doesn't look right.
 */
function load(): Category[] {
  const saved = readJSON<unknown>(STORAGE_KEY);
  if (!Array.isArray(saved)) {
    return [];
  }
  const categories: Category[] = [];
  for (const item of saved as Partial<Record<string, unknown>>[]) {
    if (
      typeof item?.['id'] === 'string' &&
      typeof item['name'] === 'string' &&
      Array.isArray(item['words'])
    ) {
      categories.push(
        toCategory(item['id'], {
          name: item['name'],
          emoji: typeof item['emoji'] === 'string' ? item['emoji'] : undefined,
          words: (item['words'] as unknown[]).filter(
            (word): word is string => typeof word === 'string',
          ),
        }),
      );
    }
  }
  return categories;
}
