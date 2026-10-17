// Type-only import: a value import would create a circular runtime dependency with isbn.ts.
import type { ISBNFormat } from "../value-objects/isbn.js";
import { DomainError } from "./domain.error.js";

export class InvalidISBNChecksumError extends DomainError {
  constructor(
    public readonly receivedValue: string,
    public readonly format: ISBNFormat,
    public readonly expectedCheckDigit: string,
    public readonly actualCheckDigit: string,
  ) {
    super(
      `Invalid ISBN${format === "isbn10" ? "-10" : "-13"} checksum: expected check digit "${expectedCheckDigit}", got "${actualCheckDigit}" (received: "${receivedValue}").`,
      "ISBN.INVALID_CHECKSUM",
    );
  }
}
