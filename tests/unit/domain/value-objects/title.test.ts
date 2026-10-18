import { describe, expect, it } from "vitest";
import { catchError } from "../../../helpers/catch-error";
import { EmptyTitleError } from "../../../../core/domain/errors/empty-title.error";
import { Title } from "../../../../core/domain/value-objects/title";

describe("Title", () => {
  describe("create", () => {
    it("creates a title and trims surrounding whitespace", () => {
      const title = Title.create("  The Hobbit  ");

      expect(title.value).toBe("The Hobbit");
    });

    it("throws EmptyTitleError for an empty string", () => {
      const error = catchError(() => Title.create(""));

      expect(error).toBeInstanceOf(EmptyTitleError);
      expect((error as EmptyTitleError).receivedValue).toBe("");
      expect((error as EmptyTitleError).code).toBe("TITLE.EMPTY");
    });

    it("throws EmptyTitleError for blank input", () => {
      expect(catchError(() => Title.create("   "))).toBeInstanceOf(EmptyTitleError);
    });
  });

  describe("equals", () => {
    it("returns true for the same value written differently", () => {
      expect(Title.create("The Hobbit").equals(Title.create("  The Hobbit "))).toBe(true);
    });

    it("returns false for different values", () => {
      expect(Title.create("The Hobbit").equals(Title.create("The Silmarillion"))).toBe(false);
    });
  });
});
