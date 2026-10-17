import { DomainError } from "./domain.error.js";

export class BookNotFoundError extends DomainError {
  constructor(public readonly bookId: string) {
    super(`Book not found with id: "${bookId}".`, "BOOK.NOT_FOUND");
  }
}
