import { describe, expect, it } from "vitest";
import { DomainError } from "../../../core/domain/errors/domain-error";
import { EmptyISBNError } from "../../../core/domain/errors/empty-isbn.error";
import { InvalidISBNCharactersError } from "../../../core/domain/errors/invalid-isbn-characters.error";
import { InvalidISBNChecksumError } from "../../../core/domain/errors/invalid-isbn-checksum.error";
import { InvalidISBNLengthError } from "../../../core/domain/errors/invalid-isbn-length.error";
import { ISBN } from "../../../core/domain/value-objects/isbn";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("ISBN", () => {
  describe("create", () => {
    it("creates an ISBN-10 and normalizes hyphens", () => {
      const isbn = ISBN.create("0-306-40615-2");

      expect(isbn.value).toBe("0306406152");
      expect(isbn.format).toBe("isbn10");
    });

    it("creates an ISBN-13 and normalizes hyphens", () => {
      const isbn = ISBN.create("978-0-306-40615-7");

      expect(isbn.value).toBe("9780306406157");
      expect(isbn.format).toBe("isbn13");
    });

    it("accepts spaces and surrounding whitespace", () => {
      const isbn = ISBN.create("  978 0 306 40615 7 ");

      expect(isbn.value).toBe("9780306406157");
    });

    it("accepts ISBN-10 with X check digit, regardless of case", () => {
      const isbn = ISBN.create("0-486-65088-x");

      expect(isbn.value).toBe("048665088X");
      expect(isbn.format).toBe("isbn10");
    });

    it("throws EmptyISBNError for an empty string", () => {
      const error = catchError(() => ISBN.create(""));

      expect(error).toBeInstanceOf(EmptyISBNError);
      expect((error as EmptyISBNError).receivedValue).toBe("");
      expect((error as EmptyISBNError).code).toBe("ISBN.EMPTY");
      expect((error as EmptyISBNError).name).toBe("EmptyISBNError");
    });

    it("throws EmptyISBNError for blank input", () => {
      expect(catchError(() => ISBN.create("   "))).toBeInstanceOf(EmptyISBNError);
    });

    it("throws EmptyISBNError when only separators remain", () => {
      expect(catchError(() => ISBN.create("---"))).toBeInstanceOf(EmptyISBNError);
    });

    it("throws InvalidISBNLengthError for a wrong length", () => {
      const error = catchError(() => ISBN.create("12345"));

      expect(error).toBeInstanceOf(InvalidISBNLengthError);
      expect((error as InvalidISBNLengthError).receivedValue).toBe("12345");
      expect((error as InvalidISBNLengthError).actualLength).toBe(5);
      expect((error as InvalidISBNLengthError).code).toBe("ISBN.INVALID_LENGTH");
    });

    it("throws InvalidISBNCharactersError when ISBN-13 contains a letter", () => {
      const error = catchError(() => ISBN.create("978030640615X"));

      expect(error).toBeInstanceOf(InvalidISBNCharactersError);
      expect((error as InvalidISBNCharactersError).invalidCharacters).toEqual(["X"]);
      expect((error as InvalidISBNCharactersError).format).toBe("isbn13");
      expect((error as InvalidISBNCharactersError).code).toBe("ISBN.INVALID_CHARACTERS");
    });

    it("throws InvalidISBNCharactersError when ISBN-10 contains non-digit letters", () => {
      const error = catchError(() => ISBN.create("abcdefghij"));

      expect(error).toBeInstanceOf(InvalidISBNCharactersError);
      expect((error as InvalidISBNCharactersError).invalidCharacters).toEqual([
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
      ]);
    });

    it("throws InvalidISBNCharactersError when X is not the check digit", () => {
      const error = catchError(() => ISBN.create("X048665088"));

      expect(error).toBeInstanceOf(InvalidISBNCharactersError);
      expect((error as InvalidISBNCharactersError).invalidCharacters).toEqual(["X"]);
      expect((error as InvalidISBNCharactersError).format).toBe("isbn10");
    });

    it("throws InvalidISBNChecksumError for an ISBN-10 with wrong check digit", () => {
      const error = catchError(() => ISBN.create("0306406153"));

      expect(error).toBeInstanceOf(InvalidISBNChecksumError);
      expect((error as InvalidISBNChecksumError).expectedCheckDigit).toBe("2");
      expect((error as InvalidISBNChecksumError).actualCheckDigit).toBe("3");
      expect((error as InvalidISBNChecksumError).format).toBe("isbn10");
      expect((error as InvalidISBNChecksumError).code).toBe("ISBN.INVALID_CHECKSUM");
    });

    it("throws InvalidISBNChecksumError for an ISBN-13 with wrong check digit", () => {
      const error = catchError(() => ISBN.create("9780306406156"));

      expect(error).toBeInstanceOf(InvalidISBNChecksumError);
      expect((error as InvalidISBNChecksumError).expectedCheckDigit).toBe("7");
      expect((error as InvalidISBNChecksumError).actualCheckDigit).toBe("6");
      expect((error as InvalidISBNChecksumError).format).toBe("isbn13");
    });

    it("throws errors that extend DomainError so consumers can catch them generically", () => {
      expect(catchError(() => ISBN.create(""))).toBeInstanceOf(DomainError);
      expect(catchError(() => ISBN.create("12345"))).toBeInstanceOf(DomainError);
      expect(catchError(() => ISBN.create("abcdefghij"))).toBeInstanceOf(DomainError);
      expect(catchError(() => ISBN.create("0306406153"))).toBeInstanceOf(DomainError);
    });
  });

  describe("equals", () => {
    it("returns true for the same value written differently", () => {
      expect(ISBN.create("0-306-40615-2").equals(ISBN.create("0306406152"))).toBe(true);
    });

    it("returns false for different values", () => {
      expect(ISBN.create("0306406152").equals(ISBN.create("9780306406157"))).toBe(false);
    });
  });
});
