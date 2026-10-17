// Initial articles used by the title sort-key suggestion.
// Consumers of the core can extend this list or provide their own strategy.

export const ENGLISH_TITLE_ARTICLES = ["The", "A", "An"];

export const PORTUGUESE_TITLE_ARTICLES = ["O", "A", "Os", "As"];

/** Default suggestion: English + Portuguese articles. */
export const DEFAULT_TITLE_ARTICLES = [...ENGLISH_TITLE_ARTICLES, ...PORTUGUESE_TITLE_ARTICLES];
