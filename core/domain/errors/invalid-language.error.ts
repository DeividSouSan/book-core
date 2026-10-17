import { DomainError } from "./domain.error";
import { SUPPORTED_LANGUAGE_CODES } from "../value-objects/language.constants";

export class InvalidLanguageError extends DomainError {
  constructor(
    public readonly receivedValue: string,
    public readonly supportedLanguages: readonly string[] = SUPPORTED_LANGUAGE_CODES,
  ) {
    super(
      `Invalid language: "${receivedValue}". Supported languages: ${supportedLanguages.join(", ")}.`,
      "LANGUAGE.INVALID",
    );
  }
}
