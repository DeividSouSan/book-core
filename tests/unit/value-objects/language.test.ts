import { describe, expect, it } from "vitest";
import { InvalidLanguageError } from "../../../core/domain/errors/invalid-language.error";
import { Language } from "../../../core/domain/value-objects/language";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("Language", () => {
  describe("create", () => {
    it("creates a Portuguese language", () => {
      const language = Language.create("pt");

      expect(language.value).toBe("pt");
    });

    it("creates an English language", () => {
      const language = Language.create("en");

      expect(language.value).toBe("en");
    });

    it("throws InvalidLanguageError for an empty string", () => {
      const error = catchError(() => Language.create(""));

      expect(error).toBeInstanceOf(InvalidLanguageError);
      expect((error as InvalidLanguageError).receivedValue).toBe("");
      expect((error as InvalidLanguageError).code).toBe("LANGUAGE.INVALID");
    });

    it("throws InvalidLanguageError for an unsupported language", () => {
      const error = catchError(() => Language.create("fr"));

      expect(error).toBeInstanceOf(InvalidLanguageError);
      expect((error as InvalidLanguageError).receivedValue).toBe("fr");
      expect((error as InvalidLanguageError).code).toBe("LANGUAGE.INVALID");
    });

    it("normalizes uppercase input to lowercase", () => {
      const language = Language.create("PT");

      expect(language.value).toBe("pt");
    });
  });

  describe("equals", () => {
    it("returns true for the same value", () => {
      expect(Language.create("pt").equals(Language.create("pt"))).toBe(true);
    });

    it("returns false for different values", () => {
      expect(Language.create("pt").equals(Language.create("en"))).toBe(false);
    });
  });
});
