// Artigos iniciais usados pela sugestão de ordenação de título.
// Quem consumir o núcleo pode estender esta lista ou fornecer sua própria estratégia.

export const ENGLISH_TITLE_ARTICLES = ["The", "A", "An"];

export const PORTUGUESE_TITLE_ARTICLES = ["O", "A", "Os", "As"];

/** Default suggestion: English + Portuguese articles. */
export const DEFAULT_TITLE_ARTICLES = [...ENGLISH_TITLE_ARTICLES, ...PORTUGUESE_TITLE_ARTICLES];
