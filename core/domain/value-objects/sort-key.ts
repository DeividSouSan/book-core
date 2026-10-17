import { DEFAULT_TITLE_ARTICLES } from "./articles.constants";

// Estratégia substituível de ordenação de título.
// O núcleo expõe uma sugestão (defaultTitleSortKey), mas o consumidor pode
// injetar qualquer função (string) => string.

export type TitleSortKeyStrategy = (title: string) => string;

/**
 * Remove artigos iniciais (case insensitive) de um título para ordenação.
 * Não remove artigos no meio do título. Normaliza espaços após a remoção.
 */
export function removeLeadingArticles(title: string, articles: string[]): string {
  if (!title) {
    return title;
  }

  const trimmed = title.trim();
  const pattern = new RegExp(`^(${articles.join("|")})\\s+`, "i");

  return trimmed.replace(pattern, "").trim();
}

/** Sugestão default do núcleo: ignora artigos em português e inglês. */
export function defaultTitleSortKey(title: string): string {
  return removeLeadingArticles(title, DEFAULT_TITLE_ARTICLES);
}
