import { describe, expect, it } from "vitest";
import { DomainError } from "../../../core/domain/errors/domain.error";
import { EmptyTitleError } from "../../../core/domain/errors/empty-title.error";
import { EmptyAuthorError } from "../../../core/domain/errors/empty-author.error";
import { EmptyISBNError } from "../../../core/domain/errors/empty-isbn.error";
import { InvalidISBNLengthError } from "../../../core/domain/errors/invalid-isbn-length.error";
import { InvalidReadingStatusError } from "../../../core/domain/errors/invalid-reading-status.error";
import { InvalidRatingError } from "../../../core/domain/errors/invalid-rating.error";
import { InvalidLanguageError } from "../../../core/domain/errors/invalid-language.error";
import { Book } from "../../../core/domain/entities/book";
import { Title } from "../../../core/domain/value-objects/title";
import { Author } from "../../../core/domain/value-objects/author";
import { ISBN } from "../../../core/domain/value-objects/isbn";
import { ReadingStatus } from "../../../core/domain/value-objects/reading-status";
import { Rating } from "../../../core/domain/value-objects/rating";
import { Language } from "../../../core/domain/value-objects/language";

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

    it("defaults status to TO_READ when not provided", () => {
      const book = Book.create(validProps);

      expect(book.status.value).toBe("TO_READ");
    });

    it("creates a book with status, rating, observation and language", () => {
      const book = Book.create({
        ...validProps,
        status: "READING",
        rating: 4,
        observation: "Gostei mas achei raso",
        language: "pt",
      });

      expect(book.status.value).toBe("READING");
      expect(book.rating?.value).toBe(4);
      expect(book.observation).toBe("Gostei mas achei raso");
      expect(book.language?.value).toBe("pt");
    });

    it("leaves rating, observation and language undefined when not provided", () => {
      const book = Book.create(validProps);

      expect(book.rating).toBeUndefined();
      expect(book.observation).toBeUndefined();
      expect(book.language).toBeUndefined();
    });

    it("propagates InvalidReadingStatusError with context", () => {
      const error = catchError(() => Book.create({ ...validProps, status: "PAUSED" }));

      expect(error).toBeInstanceOf(InvalidReadingStatusError);
      expect((error as InvalidReadingStatusError).code).toBe("READING_STATUS.INVALID");
      expect((error as InvalidReadingStatusError).receivedValue).toBe("PAUSED");
    });

    it("propagates InvalidRatingError with context", () => {
      const error = catchError(() => Book.create({ ...validProps, rating: 7 }));

      expect(error).toBeInstanceOf(InvalidRatingError);
      expect((error as InvalidRatingError).code).toBe("RATING.INVALID");
      expect((error as InvalidRatingError).receivedValue).toBe(7);
    });

    it("propagates InvalidLanguageError with context", () => {
      const error = catchError(() => Book.create({ ...validProps, language: "fr" }));

      expect(error).toBeInstanceOf(InvalidLanguageError);
      expect((error as InvalidLanguageError).code).toBe("LANGUAGE.INVALID");
      expect((error as InvalidLanguageError).receivedValue).toBe("fr");
    });
  });

  describe("restore", () => {
    const validRestoreProps = {
      id: "fixed-id-1234",
      title: Title.create("The Hobbit"),
      authors: [Author.create("J.R.R. Tolkien")],
      isbn: ISBN.create("978-0-261-10221-7"),
    };

    it("restores a book with the provided id instead of generating a new UUID", () => {
      const book = Book.restore(validRestoreProps);

      expect(book.id).toBe("fixed-id-1234");
      expect(book.title.value).toBe("The Hobbit");
      expect(book.authors).toHaveLength(1);
      expect(book.authors[0].value).toBe("J.R.R. Tolkien");
      expect(book.isbn.value).toBe("9780261102217");
    });

    it("preserves title, authors and isbn exactly as provided", () => {
      const book = Book.restore(validRestoreProps);

      expect(book.title).toBe(validRestoreProps.title);
      expect(book.authors).toEqual(validRestoreProps.authors);
      expect(book.isbn).toBe(validRestoreProps.isbn);
    });

    it("two restored books with the same id are equal even with different data", () => {
      const first = Book.restore(validRestoreProps);
      const second = Book.restore({
        ...validRestoreProps,
        title: Title.create("Completely Different Title"),
      });

      expect(first.equals(second)).toBe(true);
    });

    it("a restored book is equal to a created book when they share the same id", () => {
      const created = Book.create({
        title: "The Hobbit",
        authors: ["J.R.R. Tolkien"],
        isbn: "978-0-261-10221-7",
      });
      const restored = Book.restore({ ...validRestoreProps, id: created.id });

      expect(restored.equals(created)).toBe(true);
    });

    it("restores status, rating, observation and language exactly as provided", () => {
      const book = Book.restore({
        ...validRestoreProps,
        status: ReadingStatus.create("READ"),
        rating: Rating.create(5),
        observation: "Masterpiece",
        language: Language.create("en"),
      });

      expect(book.status.value).toBe("READ");
      expect(book.rating?.value).toBe(5);
      expect(book.observation).toBe("Masterpiece");
      expect(book.language?.value).toBe("en");
    });

    it("keeps legacy persisted data restorable — status defaults to TO_READ when absent", () => {
      const book = Book.restore(validRestoreProps);

      expect(book.status.value).toBe("TO_READ");
      expect(book.rating).toBeUndefined();
      expect(book.observation).toBeUndefined();
      expect(book.language).toBeUndefined();
    });
  });
});
