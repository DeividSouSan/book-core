import { DomainError } from "./domain.error";

export class EmptyAuthorError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`Author name must not be empty (received: "${receivedValue}").`, "AUTHOR.EMPTY");
  }
}
