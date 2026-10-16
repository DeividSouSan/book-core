import type { ISBNFormat } from "../value-objects/isbn";
import { DomainError } from "./domain.error";

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
