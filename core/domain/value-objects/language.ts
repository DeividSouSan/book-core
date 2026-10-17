import { InvalidLanguageError } from "../errors/invalid-language.error.js";
import { SUPPORTED_LANGUAGE_CODES } from "./language.constants.js";

export class Language {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): Language {
    // Language codes are case-insensitive ("PT" and "pt" mean Portuguese):
    // the value is normalized to lowercase so comparison is reliable.
    const language = receivedValue.toLowerCase().trim();

    if (!SUPPORTED_LANGUAGE_CODES.includes(language)) {
      throw new InvalidLanguageError(receivedValue);
    }

    return new Language(language);
  }

  equals(other: Language): boolean {
    return this.value === other.value;
  }
}
