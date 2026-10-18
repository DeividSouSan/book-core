import { describe, expect, it } from "vitest";
import { DomainError } from "../../../core/domain/errors/domain.error";
import { EmptyTitleError } from "../../../core/domain/errors/empty-title.error";
import { EmptyAuthorError } from "../../../core/domain/errors/empty-author.error";
import { EmptyISBNError } from "../../../core/domain/errors/empty-isbn.error";
import { EmptyGenreIdError } from "../../../core/domain/errors/empty-genre-id.error";
import { DuplicateGenreIdError } from "../../../core/domain/errors/duplicate-genre-id.error";
import { InvalidISBNLengthError } from "../../../core/domain/errors/invalid-isbn-length.error";
import { InvalidReadingStatusError } from "../../../core/domain/errors/invalid-reading-status.error";
import { InvalidRatingError } from "../../../core/domain/errors/invalid-rating.error";
import { InvalidLanguageError } from "../../../core/domain/errors/invalid-language.error";
import { InvalidUuidError } from "../../../core/domain/errors/invalid-uuid.error";
import { Book } from "../../../core/domain/entities/book";
import { Title } from "../../../core/domain/value-objects/title";
import { Author } from "../../../core/domain/value-objects/author";
import { ISBN } from "../../../core/domain/value-objects/isbn";
import { ReadingStatus } from "../../../core/domain/value-objects/reading-status";
import { Rating } from "../../../core/domain/value-objects/rating";
import { Language } from "../../../core/domain/value-objects/language";
import { GenreId } from "../../../core/domain/value-objects/genre-id";
import { Uuid } from "../../../core/domain/value-objects/uuid";

function catchError(action: () => unknown): unknown {
  try {
    action();
    return undefined;
  } catch (error) {
    return error;
  }
}

const FIRST_UUID = "550e8400-e29b-41d4-a716-446655440000";
const SECOND_UUID = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";

describe("Book", () => {
  const validProps = {
    title: "The Hobbit",
    authors: ["J.R.R. Tolkien"],
    isbn: "978-0-261-10221-7",
  };

  describe("create", () => {
    it("creates a book with the injected id as a typed Uuid value object", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.id).toBeInstanceOf(Uuid);
      expect(book.id.value).toBe(FIRST_UUID);
      expect(book.title.value).toBe("The Hobbit");
      expect(book.isbn.value).toBe("9780261102217");
      expect(book.authors).toHaveLength(1);
      expect(book.authors[0].value).toBe("J.R.R. Tolkien");
    });

    it("throws InvalidUuidError for a non-UUID id", () => {
      const error = catchError(() => Book.create(validProps, "fixed-id-1234"));

      expect(error).toBeInstanceOf(InvalidUuidError);
      expect((error as InvalidUuidError).code).toBe("UUID.INVALID");
      expect((error as InvalidUuidError).receivedValue).toBe("fixed-id-1234");
    });

    it("trims title and author names", () => {
      const book = Book.create(
        {
          title: "  The Hobbit  ",
          authors: ["  J.R.R. Tolkien  "],
          isbn: "978-0-261-10221-7",
        },
        FIRST_UUID,
      );

      expect(book.title.value).toBe("The Hobbit");
      expect(book.authors[0].value).toBe("J.R.R. Tolkien");
    });

    it("accepts an empty authors list — unknown author is a valid catalogue state", () => {
      const book = Book.create(
        {
          title: "Anonymous Folk Tale",
          authors: [],
          isbn: "978-0-261-10221-7",
        },
        FIRST_UUID,
      );

      expect(book.authors).toEqual([]);
    });

    it("distinguishes books by injected id — identity comes from id, not value", () => {
      const first = Book.create(validProps, FIRST_UUID);
      const second = Book.create(validProps, SECOND_UUID);

      expect(first.id.value).not.toBe(second.id.value);
      expect(first.equals(second)).toBe(false);
    });

    it("is equal to itself", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.equals(book)).toBe(true);
    });
  });

  describe("create validation", () => {
    it("throws EmptyTitleError propagating title validation", () => {
      const error = catchError(() =>
        Book.create(
          { title: "", authors: ["J.R.R. Tolkien"], isbn: "978-0-261-10221-7" },
          FIRST_UUID,
        ),
      );

      expect(error).toBeInstanceOf(EmptyTitleError);
      expect((error as EmptyTitleError).code).toBe("TITLE.EMPTY");
    });

    it("throws EmptyAuthorError propagating author validation", () => {
      const error = catchError(() =>
        Book.create({ title: "The Hobbit", authors: [""], isbn: "978-0-261-10221-7" }, FIRST_UUID),
      );

      expect(error).toBeInstanceOf(EmptyAuthorError);
      expect((error as EmptyAuthorError).code).toBe("AUTHOR.EMPTY");
    });

    it("propagates ISBN errors so consumers can catch them via DomainError", () => {
      const error = catchError(() =>
        Book.create({ title: "The Hobbit", authors: ["J.R.R. Tolkien"], isbn: "" }, FIRST_UUID),
      );

      expect(error).toBeInstanceOf(EmptyISBNError);
      expect(error).toBeInstanceOf(DomainError);
    });

    it("propagates invalid ISBN length with context", () => {
      const error = catchError(() =>
        Book.create(
          { title: "The Hobbit", authors: ["J.R.R. Tolkien"], isbn: "12345" },
          FIRST_UUID,
        ),
      );

      expect(error).toBeInstanceOf(InvalidISBNLengthError);
      expect((error as InvalidISBNLengthError).actualLength).toBe(5);
    });

    it("defaults status to TO_READ when not provided", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.status.value).toBe("TO_READ");
    });

    it("creates a book with status, rating, observation and language", () => {
      const book = Book.create(
        {
          ...validProps,
          status: "READING",
          rating: 4,
          observation: "Gostei mas achei raso",
          language: "pt",
        },
        FIRST_UUID,
      );

      expect(book.status.value).toBe("READING");
      expect(book.rating?.value).toBe(4);
      expect(book.observation).toBe("Gostei mas achei raso");
      expect(book.language?.value).toBe("pt");
    });

    it("leaves rating, observation and language undefined when not provided", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.rating).toBeUndefined();
      expect(book.observation).toBeUndefined();
      expect(book.language).toBeUndefined();
    });

    it("defaults favorited to undefined when not provided", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.favorited).toBeUndefined();
    });

    it("creates a book with favorited set to true", () => {
      const book = Book.create({ ...validProps, favorited: true }, FIRST_UUID);

      expect(book.favorited).toBe(true);
    });

    it("creates a book with favorited set to false", () => {
      const book = Book.create({ ...validProps, favorited: false }, FIRST_UUID);

      expect(book.favorited).toBe(false);
    });

    it("propagates favorited exactly as provided", () => {
      const book = Book.create({ ...validProps, favorited: true }, SECOND_UUID);

      expect(book.favorited).toBe(true);

      const notFavorite = Book.create({ ...validProps, favorited: false }, FIRST_UUID);

      expect(notFavorite.favorited).toBe(false);
    });

    it("defaults cover to undefined when not provided", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.cover).toBeUndefined();
    });

    it("creates a book with cover set", () => {
      const book = Book.create(
        { ...validProps, cover: "https://example.com/cover.jpg" },
        FIRST_UUID,
      );

      expect(book.cover).toBe("https://example.com/cover.jpg");
    });

    it("trims cover before storing", () => {
      const book = Book.create(
        { ...validProps, cover: "  https://example.com/cover.jpg  " },
        FIRST_UUID,
      );

      expect(book.cover).toBe("https://example.com/cover.jpg");
    });

    it("propagates cover exactly as provided after trim", () => {
      const book = Book.create(
        { ...validProps, cover: "https://example.com/capa.jpg" },
        SECOND_UUID,
      );

      expect(book.cover).toBe("https://example.com/capa.jpg");
    });

    it("propagates InvalidReadingStatusError with context", () => {
      const error = catchError(() => Book.create({ ...validProps, status: "PAUSED" }, FIRST_UUID));

      expect(error).toBeInstanceOf(InvalidReadingStatusError);
      expect((error as InvalidReadingStatusError).code).toBe("READING_STATUS.INVALID");
      expect((error as InvalidReadingStatusError).receivedValue).toBe("PAUSED");
    });

    it("propagates InvalidRatingError with context", () => {
      const error = catchError(() => Book.create({ ...validProps, rating: 7 }, FIRST_UUID));

      expect(error).toBeInstanceOf(InvalidRatingError);
      expect((error as InvalidRatingError).code).toBe("RATING.INVALID");
      expect((error as InvalidRatingError).receivedValue).toBe(7);
    });

    it("propagates InvalidLanguageError with context", () => {
      const error = catchError(() => Book.create({ ...validProps, language: "fr" }, FIRST_UUID));

      expect(error).toBeInstanceOf(InvalidLanguageError);
      expect((error as InvalidLanguageError).code).toBe("LANGUAGE.INVALID");
      expect((error as InvalidLanguageError).receivedValue).toBe("fr");
    });
  });

  describe("genres", () => {
    it("defaults genres to an empty list", () => {
      const book = Book.create(validProps, FIRST_UUID);

      expect(book.genres).toEqual([]);
    });

    it("keeps the order of the provided genres", () => {
      const book = Book.create(
        { ...validProps, genres: ["Fantasy", "Sci-Fi", "Mystery"] },
        FIRST_UUID,
      );

      expect(book.genres.map((g) => g.value)).toEqual(["Fantasy", "Sci-Fi", "Mystery"]);
    });

    it("is not affected by later mutation of the input array", () => {
      const input = ["Fantasy"];
      const book = Book.create({ ...validProps, genres: input }, FIRST_UUID);

      input.push("Sci-Fi");

      expect(book.genres).toHaveLength(1);
      expect(book.genres[0].value).toBe("Fantasy");
    });

    it("throws EmptyGenreIdError when any genre id is blank", () => {
      const error = catchError(() =>
        Book.create({ ...validProps, genres: ["Fantasy", ""] }, FIRST_UUID),
      );

      expect(error).toBeInstanceOf(EmptyGenreIdError);
      expect((error as EmptyGenreIdError).code).toBe("GENRE_ID.EMPTY");
      expect((error as EmptyGenreIdError).receivedValue).toBe("");
    });

    it("throws DuplicateGenreIdError for a repeated identifier, with code and context", () => {
      const error = catchError(() =>
        Book.create({ ...validProps, genres: ["Fantasy", "Fantasy"] }, FIRST_UUID),
      );

      expect(error).toBeInstanceOf(DuplicateGenreIdError);
      expect((error as DuplicateGenreIdError).code).toBe("GENRE_ID.DUPLICATED");
      expect((error as DuplicateGenreIdError).duplicatedValue).toBe("Fantasy");
    });

    it("does not treat 'Fantasy' and 'fantasy' as duplicates", () => {
      const book = Book.create({ ...validProps, genres: ["Fantasy", "fantasy"] }, FIRST_UUID);

      expect(book.genres).toHaveLength(2);
    });
  });

  describe("restore", () => {
    const validRestoreProps = {
      id: Uuid.create(FIRST_UUID),
      title: Title.create("The Hobbit"),
      authors: [Author.create("J.R.R. Tolkien")],
      isbn: ISBN.create("978-0-261-10221-7"),
    };

    it("restores a book with the provided id instead of generating a new one", () => {
      const book = Book.restore(validRestoreProps);

      expect(book.id.value).toBe(FIRST_UUID);
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
      const created = Book.create(
        {
          title: "The Hobbit",
          authors: ["J.R.R. Tolkien"],
          isbn: "978-0-261-10221-7",
        },
        FIRST_UUID,
      );
      const restored = Book.restore({ ...validRestoreProps });

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
      expect(book.favorited).toBeUndefined();
    });

    it("restores favorited exactly as provided", () => {
      const book = Book.restore({
        ...validRestoreProps,
        favorited: true,
      });

      expect(book.favorited).toBe(true);

      const notFavorite = Book.restore({
        ...validRestoreProps,
        favorited: false,
      });

      expect(notFavorite.favorited).toBe(false);
    });

    it("restores cover exactly as provided", () => {
      const book = Book.restore({
        ...validRestoreProps,
        cover: "https://example.com/cover.jpg",
      });

      expect(book.cover).toBe("https://example.com/cover.jpg");

      const noCover = Book.restore(validRestoreProps);

      expect(noCover.cover).toBeUndefined();
    });

    it("keeps the given genre ids, and defaults to an empty list when absent", () => {
      const withGenres = Book.restore({
        ...validRestoreProps,
        genres: [GenreId.create("Fantasy"), GenreId.create("Sci-Fi")],
      });

      expect(withGenres.genres.map((g) => g.value)).toEqual(["Fantasy", "Sci-Fi"]);

      const withoutGenres = Book.restore(validRestoreProps);

      expect(withoutGenres.genres).toEqual([]);
    });
  });
});
