import { DomainError } from "./domain.error.js";

export class EmptyISBNError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`ISBN must not be empty (received: "${receivedValue}").`, "ISBN.EMPTY");
  }
}
