import { describe, expect, it } from "vitest";
import { EmptyAuthorError } from "../../../../core/domain/errors/empty-author.error";
import { Author } from "../../../../core/domain/value-objects/author";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("Author", () => {
  describe("create", () => {
    it("creates an author and trims surrounding whitespace", () => {
      const author = Author.create("  J.R.R. Tolkien  ");

      expect(author.value).toBe("J.R.R. Tolkien");
    });

    it("throws EmptyAuthorError for an empty string", () => {
      const error = catchError(() => Author.create(""));

      expect(error).toBeInstanceOf(EmptyAuthorError);
      expect((error as EmptyAuthorError).receivedValue).toBe("");
      expect((error as EmptyAuthorError).code).toBe("AUTHOR.EMPTY");
    });

    it("throws EmptyAuthorError for blank input", () => {
      expect(catchError(() => Author.create("   "))).toBeInstanceOf(EmptyAuthorError);
    });
  });

  describe("equals", () => {
    it("returns true for the same value written differently", () => {
      expect(Author.create("J.R.R. Tolkien").equals(Author.create("  J.R.R. Tolkien "))).toBe(true);
    });

    it("returns false for different values", () => {
      expect(Author.create("J.R.R. Tolkien").equals(Author.create("Ursula K. Le Guin"))).toBe(
        false,
      );
    });
  });
});
