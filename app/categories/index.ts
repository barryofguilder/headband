import type { Category } from './types';

export type { Category } from './types';

/**
 * Every file in ./built-in is picked up automatically. To add a category,
 * copy one of the existing files, give it a new id, and fill in the words.
 */
const modules = import.meta.glob<{ default: Category }>('./built-in/*.ts', {
  eager: true,
});

export const builtInCategories: Category[] = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.name.localeCompare(b.name));

export function findBuiltInCategory(id: string): Category | undefined {
  return builtInCategories.find((category) => category.id === id);
}
