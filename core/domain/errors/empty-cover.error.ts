import { DomainError } from "./domain.error.js";

export class EmptyCoverError extends DomainError {
  constructor(public readonly receivedValue: string) {
    super(`Cover URL must not be empty (received: "${receivedValue}").`, "COVER.EMPTY");
  }
}
