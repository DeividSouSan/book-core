import { DomainError } from "./domain-error";

export class EmptyISBNError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`ISBN must not be empty (received: "${receivedValue}").`, "ISBN.EMPTY");
  }
}
