import { DomainError } from "./domain.error.js";

// Thrown when Book.create receives a repeated genre identifier.
// The comparison is exact (case-sensitive): "Fantasy" and "fantasy" are not
// treated as duplicates.
export class DuplicateGenreIdError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`Duplicate genre id (received: "${receivedValue}").`, "GENRE_ID.DUPLICATED");
  }
}
