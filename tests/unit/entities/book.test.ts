import { describe, expect, it } from "vitest";
import { DomainError } from "../../../core/domain/errors/domain.error";
import { EmptyTitleError } from "../../../core/domain/errors/empty-title.error";
import { EmptyAuthorError } from "../../../core/domain/errors/empty-author.error";
import { EmptyISBNError } from "../../../core/domain/errors/empty-isbn.error";
import { InvalidISBNLengthError } from "../../../core/domain/errors/invalid-isbn-length.error";
import { Book } from "../../../core/domain/entities/book";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("Book", () => {
  const validProps = {
    title: "The Hobbit",
    authors: ["J.R.R. Tolkien"],
    isbn: "978-0-261-10221-7",
  };

  describe("create", () => {
    it("creates a book with typed value objects and generates a UUID id", () => {
      const book = Book.create(validProps);

      expect(book.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(book.title.value).toBe("The Hobbit");
      expect(book.isbn.value).toBe("9780261102217");
      expect(book.authors).toHaveLength(1);
      expect(book.authors[0].value).toBe("J.R.R. Tolkien");
    });

    it("trims title and author names", () => {
      const book = Book.create({
        title: "  The Hobbit  ",
        authors: ["  J.R.R. Tolkien  "],
        isbn: "978-0-261-10221-7",
      });

      expect(book.title.value).toBe("The Hobbit");
      expect(book.authors[0].value).toBe("J.R.R. Tolkien");
    });

    it("accepts an empty authors list — unknown author is a valid catalogue state", () => {
      const book = Book.create({
        title: "Anonymous Folk Tale",
        authors: [],
        isbn: "978-0-261-10221-7",
      });

      expect(book.authors).toEqual([]);
    });

    it("generates different ids for two books with identical data — identity comes from id, not value", () => {
      const first = Book.create(validProps);
      const second = Book.create(validProps);

      expect(first.id).not.toBe(second.id);
      expect(first.equals(second)).toBe(false);
    });

    it("is equal to itself", () => {
      const book = Book.create(validProps);

      expect(book.equals(book)).toBe(true);
    });

    it("throws EmptyTitleError propagating title validation", () => {
      const error = catchError(() =>
        Book.create({ title: "", authors: ["J.R.R. Tolkien"], isbn: "978-0-261-10221-7" }),
      );

      expect(error).toBeInstanceOf(EmptyTitleError);
      expect((error as EmptyTitleError).code).toBe("TITLE.EMPTY");
    });

    it("throws EmptyAuthorError propagating author validation", () => {
      const error = catchError(() =>
        Book.create({ title: "The Hobbit", authors: [""], isbn: "978-0-261-10221-7" }),
      );

      expect(error).toBeInstanceOf(EmptyAuthorError);
      expect((error as EmptyAuthorError).code).toBe("AUTHOR.EMPTY");
    });

    it("propagates ISBN errors so consumers can catch them via DomainError", () => {
      const error = catchError(() =>
        Book.create({ title: "The Hobbit", authors: ["J.R.R. Tolkien"], isbn: "" }),
      );

      expect(error).toBeInstanceOf(EmptyISBNError);
      expect(error).toBeInstanceOf(DomainError);
    });

    it("propagates invalid ISBN length with context", () => {
      const error = catchError(() =>
        Book.create({ title: "The Hobbit", authors: ["J.R.R. Tolkien"], isbn: "12345" }),
      );

      expect(error).toBeInstanceOf(InvalidISBNLengthError);
      expect((error as InvalidISBNLengthError).actualLength).toBe(5);
    });
  });
});
