import { DomainError } from "./domain-error";

export class InvalidISBNLengthError extends DomainError {
  constructor(
    public readonly receivedValue: string,
    public readonly actualLength: number,
  ) {
    super(
      `Invalid ISBN length: expected 10 or 13 characters (hyphens and spaces ignored), got ${actualLength} (received: "${receivedValue}").`,
      "ISBN.INVALID_LENGTH",
    );
  }
}
