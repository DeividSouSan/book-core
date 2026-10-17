// Type-only import: a value import would create a circular runtime dependency with isbn.ts.
import type { ISBNFormat } from "../value-objects/isbn.js";
import { DomainError } from "./domain.error.js";

export class InvalidISBNCharactersError extends DomainError {
  constructor(
    public readonly receivedValue: string,
    public readonly invalidCharacters: string[],
    public readonly format: ISBNFormat,
  ) {
    const expected =
      format === "isbn10" ? 'digits 0-9 (only the check digit may be "X")' : "digits 0-9";

    super(
      `Invalid ISBN${format === "isbn10" ? "-10" : "-13"} character(s): ${invalidCharacters
        .map((character) => `"${character}"`)
        .join(", ")} (expected ${expected}), received: "${receivedValue}".`,
      "ISBN.INVALID_CHARACTERS",
    );
  }
}
