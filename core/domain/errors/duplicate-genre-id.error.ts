import { DomainError } from "./domain.error.js";

// Lançado quando Book.create recebe um identificador de gênero repetido.
// A comparação é exata (case-sensitive): "Fantasy" e "fantasy" não são
// tratados como duplicados.
export class DuplicateGenreIdError extends DomainError {
  constructor(public readonly duplicatedValue: string) {
    super(`Duplicate genre id (received: "${duplicatedValue}").`, "GENRE_ID.DUPLICATED");
  }
}
