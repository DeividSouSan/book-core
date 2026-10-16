import { EmptyISBNError } from "../errors/empty-isbn.error";
import { InvalidISBNCharactersError } from "../errors/invalid-isbn-characters.error";
import { InvalidISBNChecksumError } from "../errors/invalid-isbn-checksum.error";
import { InvalidISBNLengthError } from "../errors/invalid-isbn-length.error";
import {
  ISBN_10_CHECK_DIGIT_INDEX,
  ISBN_10_CHECKSUM_MODULUS,
  ISBN_10_LENGTH,
  ISBN_10_X_VALUE,
  ISBN_13_CHECK_DIGIT_INDEX,
  ISBN_13_CHECKSUM_MODULUS,
  ISBN_13_EVEN_POSITION_WEIGHT,
  ISBN_13_LENGTH,
  ISBN_13_ODD_POSITION_WEIGHT,
} from "./isbn.constants";

export type ISBNFormat = "isbn10" | "isbn13";

export class ISBN {
  private constructor(
    public readonly value: string,
    public readonly format: ISBNFormat,
  ) {}

  static create(receivedValue: string): ISBN {
    // Hyphens and spaces are presentation, not part of the value: normalize before validating.
    const normalized = receivedValue.replace(/[-\s]/g, "");

    if (normalized.length === 0) {
      throw new EmptyISBNError(receivedValue);
    }

    if (normalized.length === ISBN_10_LENGTH) {
      return ISBN.parseIsbn10(receivedValue, normalized);
    }

    if (normalized.length === ISBN_13_LENGTH) {
      return ISBN.parseIsbn13(receivedValue, normalized);
    }

    throw new InvalidISBNLengthError(receivedValue, normalized.length);
  }

  equals(other: ISBN): boolean {
    return this.value === other.value;
  }

  private static parseIsbn10(receivedValue: string, normalized: string): ISBN {
    // The ISBN-10 check digit X is case-insensitive, so uppercase before validating.
    const value = normalized.toUpperCase();
    const invalidCharacters = [
      ...new Set(
        value
          .split("")
          .filter(
            (character, index) =>
              !/\d/.test(character) && !(character === "X" && index === ISBN_10_CHECK_DIGIT_INDEX),
          ),
      ),
    ];

    if (invalidCharacters.length > 0) {
      throw new InvalidISBNCharactersError(receivedValue, invalidCharacters, "isbn10");
    }

    const actualCheckDigit = value[ISBN_10_CHECK_DIGIT_INDEX];
    const expectedCheckDigit = ISBN.calculateISBN10CheckDigit(
      value.slice(0, ISBN_10_CHECK_DIGIT_INDEX),
    );

    if (actualCheckDigit !== expectedCheckDigit) {
      throw new InvalidISBNChecksumError(
        receivedValue,
        "isbn10",
        expectedCheckDigit,
        actualCheckDigit,
      );
    }

    return new ISBN(value, "isbn10");
  }

  private static parseIsbn13(receivedValue: string, normalized: string): ISBN {
    const invalidCharacters = [
      ...new Set(normalized.split("").filter((character) => !/\d/.test(character))),
    ];

    if (invalidCharacters.length > 0) {
      throw new InvalidISBNCharactersError(receivedValue, invalidCharacters, "isbn13");
    }

    const actualCheckDigit = normalized[ISBN_13_CHECK_DIGIT_INDEX];
    const expectedCheckDigit = ISBN.calculateISBN13CheckDigit(
      normalized.slice(0, ISBN_13_CHECK_DIGIT_INDEX),
    );

    if (actualCheckDigit !== expectedCheckDigit) {
      throw new InvalidISBNChecksumError(
        receivedValue,
        "isbn13",
        expectedCheckDigit,
        actualCheckDigit,
      );
    }

    return new ISBN(normalized, "isbn13");
  }

  // ISBN-10 check digit: each digit is weighted from 10 down to 1 and the total must be a
  // multiple of 11. "X" is used when the check digit value is 10.
  private static calculateISBN10CheckDigit(digitsWithoutCheckDigit: string): string {
    let weightedSum = 0;

    for (let index = 0; index < digitsWithoutCheckDigit.length; index += 1) {
      weightedSum += Number(digitsWithoutCheckDigit[index]) * (ISBN_10_LENGTH - index);
    }

    const checkDigitValue =
      (ISBN_10_CHECKSUM_MODULUS - (weightedSum % ISBN_10_CHECKSUM_MODULUS)) %
      ISBN_10_CHECKSUM_MODULUS;

    return checkDigitValue === ISBN_10_X_VALUE ? "X" : String(checkDigitValue);
  }

  // ISBN-13 check digit: odd positions (1-based) weigh 1 and even positions weigh 3; the
  // check digit (which weighs 1) makes the total a multiple of ISBN_13_CHECKSUM_MODULUS (10).
  private static calculateISBN13CheckDigit(digitsWithoutCheckDigit: string): string {
    let weightedSum = 0;

    for (let index = 0; index < digitsWithoutCheckDigit.length; index += 1) {
      const weight = index % 2 === 0 ? ISBN_13_ODD_POSITION_WEIGHT : ISBN_13_EVEN_POSITION_WEIGHT;
      weightedSum += Number(digitsWithoutCheckDigit[index]) * weight;
    }

    return String(
      (ISBN_13_CHECKSUM_MODULUS - (weightedSum % ISBN_13_CHECKSUM_MODULUS)) %
        ISBN_13_CHECKSUM_MODULUS,
    );
  }
}
