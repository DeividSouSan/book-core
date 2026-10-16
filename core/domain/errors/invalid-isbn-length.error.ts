import { ISBN_10_LENGTH, ISBN_13_LENGTH } from "../value-objects/isbn.constants";
import { DomainError } from "./domain.error";

export class InvalidISBNLengthError extends DomainError {
  constructor(
    public readonly receivedValue: string,
    public readonly actualLength: number,
  ) {
    super(
      `Invalid ISBN length: expected ${ISBN_10_LENGTH} or ${ISBN_13_LENGTH} characters (hyphens and spaces ignored), got ${actualLength} (received: "${receivedValue}").`,
      "ISBN.INVALID_LENGTH",
    );
  }
}
