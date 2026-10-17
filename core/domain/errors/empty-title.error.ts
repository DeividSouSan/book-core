import { DomainError } from "./domain.error.js";

export class EmptyTitleError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`Title must not be empty (received: "${receivedValue}").`, "TITLE.EMPTY");
  }
}
