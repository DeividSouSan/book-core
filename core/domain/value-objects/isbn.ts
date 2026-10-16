import { EmptyISBNError } from "../errors/empty-isbn.error";
import { InvalidISBNCharactersError } from "../errors/invalid-isbn-characters.error";
import { InvalidISBNChecksumError } from "../errors/invalid-isbn-checksum.error";
import { InvalidISBNLengthError } from "../errors/invalid-isbn-length.error";

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

    if (normalized.length === 10) {
      return ISBN.parseIsbn10(receivedValue, normalized);
    }

    if (normalized.length === 13) {
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
            (character, index) => !/\d/.test(character) && !(character === "X" && index === 9),
          ),
      ),
    ];

    if (invalidCharacters.length > 0) {
      throw new InvalidISBNCharactersError(receivedValue, invalidCharacters, "isbn10");
    }

    let weightedSum = 0;
    for (let index = 0; index < 9; index += 1) {
      weightedSum += Number(value[index]) * (10 - index);
    }

    const checkDigitValue = value[9] === "X" ? 10 : Number(value[9]);

    if ((weightedSum + checkDigitValue) % 11 !== 0) {
      const expectedDigitValue = (11 - (weightedSum % 11)) % 11;
      const expectedCheckDigit = expectedDigitValue === 10 ? "X" : String(expectedDigitValue);

      throw new InvalidISBNChecksumError(receivedValue, "isbn10", expectedCheckDigit, value[9]);
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
    for (let index = 0; index < 12; index += 1) {
      weightedSum += Number(normalized[index]) * (index % 2 === 0 ? 1 : 3);
    }

    const expectedCheckDigit = String((10 - (weightedSum % 10)) % 10);

    if (normalized[12] !== expectedCheckDigit) {
      throw new InvalidISBNChecksumError(
        receivedValue,
        "isbn13",
        expectedCheckDigit,
        normalized[12],
      );
    }

    return new ISBN(normalized, "isbn13");
  }
}
