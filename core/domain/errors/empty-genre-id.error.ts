import { DomainError } from "./domain.error.js";

export class EmptyGenreIdError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`Genre id must not be empty (received: "${receivedValue}").`, "GENRE_ID.EMPTY");
  }
}
