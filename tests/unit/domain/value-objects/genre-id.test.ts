import { describe, expect, it } from "vitest";
import { EmptyGenreIdError } from "../../../../core/domain/errors/empty-genre-id.error";
import { GenreId } from "../../../../core/domain/value-objects/genre-id";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("GenreId", () => {
  describe("create", () => {
    it("creates a genre id from a non-empty string", () => {
      const genreId = GenreId.create("Fantasy");

      expect(genreId.value).toBe("Fantasy");
    });

    it("keeps the received value without trimming or changing case", () => {
      const genreId = GenreId.create("  Fantasy  ");

      expect(genreId.value).toBe("  Fantasy  ");
    });

    it("treats identifiers that differ only by case as different", () => {
      expect(GenreId.create("Fantasy").equals(GenreId.create("fantasy"))).toBe(false);
    });

    it("throws EmptyGenreIdError for an empty string", () => {
      const error = catchError(() => GenreId.create(""));

      expect(error).toBeInstanceOf(EmptyGenreIdError);
      expect((error as EmptyGenreIdError).code).toBe("GENRE_ID.EMPTY");
      expect((error as EmptyGenreIdError).receivedValue).toBe("");
    });

    it("throws EmptyGenreIdError for whitespace-only values", () => {
      const error = catchError(() => GenreId.create("   "));

      expect(error).toBeInstanceOf(EmptyGenreIdError);
      expect((error as EmptyGenreIdError).code).toBe("GENRE_ID.EMPTY");
      expect((error as EmptyGenreIdError).receivedValue).toBe("   ");
    });
  });

  describe("equals", () => {
    it("compares by exact value", () => {
      expect(GenreId.create("Fantasy").equals(GenreId.create("Fantasy"))).toBe(true);
      expect(GenreId.create("Fantasy").equals(GenreId.create("fantasy"))).toBe(false);
    });
  });
});
