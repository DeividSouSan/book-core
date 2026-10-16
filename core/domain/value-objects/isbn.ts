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

    let weightedSum = 0;
    for (let index = 0; index < ISBN_10_CHECK_DIGIT_INDEX; index += 1) {
      weightedSum += Number(value[index]) * (ISBN_10_LENGTH - index);
    }

    const actualCheckDigit = value[ISBN_10_CHECK_DIGIT_INDEX];
    const checkDigitValue = actualCheckDigit === "X" ? ISBN_10_X_VALUE : Number(actualCheckDigit);

    if ((weightedSum + checkDigitValue) % ISBN_10_CHECKSUM_MODULUS !== 0) {
      const expectedDigitValue =
        (ISBN_10_CHECKSUM_MODULUS - (weightedSum % ISBN_10_CHECKSUM_MODULUS)) %
        ISBN_10_CHECKSUM_MODULUS;
      const expectedCheckDigit =
        expectedDigitValue === ISBN_10_X_VALUE ? "X" : String(expectedDigitValue);

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

    let weightedSum = 0;
    for (let index = 0; index < ISBN_13_CHECK_DIGIT_INDEX; index += 1) {
      const weight = index % 2 === 0 ? ISBN_13_ODD_POSITION_WEIGHT : ISBN_13_EVEN_POSITION_WEIGHT;
      weightedSum += Number(normalized[index]) * weight;
    }

    const expectedCheckDigit = String(
      (ISBN_13_CHECKSUM_MODULUS - (weightedSum % ISBN_13_CHECKSUM_MODULUS)) %
        ISBN_13_CHECKSUM_MODULUS,
    );

    if (normalized[ISBN_13_CHECK_DIGIT_INDEX] !== expectedCheckDigit) {
      throw new InvalidISBNChecksumError(
        receivedValue,
        "isbn13",
        expectedCheckDigit,
        normalized[ISBN_13_CHECK_DIGIT_INDEX],
      );
    }

    return new ISBN(normalized, "isbn13");
  }
}
