import { DEFAULT_TITLE_ARTICLES } from "./articles.constants.js";

// Replaceable title sort-key strategy.
// The core exposes a suggestion (defaultTitleSortKey), but the consumer can
// inject any (string) => string function.

export type TitleSortKeyStrategy = (title: string) => string;

/**
 * Removes leading articles (case insensitive) from a title for sorting.
 * Does not remove articles in the middle of the title. Normalizes spaces after removal.
 */
export function removeLeadingArticles(title: string, articles: string[]): string {
  if (!title) {
    return title;
  }

  const trimmed = title.trim();
  const pattern = new RegExp(`^(${articles.join("|")})\\s+`, "i");

  return trimmed.replace(pattern, "").trim();
}

/** Core's default suggestion: ignores Portuguese and English articles. */
export function defaultTitleSortKey(title: string): string {
  return removeLeadingArticles(title, DEFAULT_TITLE_ARTICLES);
}
