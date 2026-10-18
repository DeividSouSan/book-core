import type { Book } from "../../core/domain/entities/book.js";
import type { ISBN } from "../../core/domain/value-objects/isbn.js";
import type { BookRepository } from "../../core/application/ports/book-repository.port.js";
import { BookNotFoundError } from "../../core/domain/errors/book-not-found.error.js";
import { Book as BookEntity } from "../../core/domain/entities/book.js";
import { Title } from "../../core/domain/value-objects/title.js";
import { Author } from "../../core/domain/value-objects/author.js";
import { ISBN as ISBNValue } from "../../core/domain/value-objects/isbn.js";
import { Uuid } from "../../core/domain/value-objects/uuid.js";
import { ReadingStatus } from "../../core/domain/value-objects/reading-status.js";
import { Rating } from "../../core/domain/value-objects/rating.js";
import { Language } from "../../core/domain/value-objects/language.js";
import { GenreId } from "../../core/domain/value-objects/genre-id.js";
import { DEFAULT_STORAGE_KEY } from "./book-repository.local-storage.constants.js";
import { StorageCorruptedError } from "./storage-corrupted.error.js";

// Minimal structural interface of the Web Storage API (getItem/setItem) so
// the adapter works with the browser's localStorage, sessionStorage, or any
// compatible fake in tests — without depending on the DOM lib in tsconfig.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Shape of a Book after serialization: value objects are flattened to plain
// primitives so the record survives JSON roundtrips.
interface StoredBook {
  id: string;
  title: string;
  authors: string[];
  status: string;
  isbn?: string;
  rating?: number;
  observation?: string;
  language?: string;
  favorited?: boolean;
  cover?: string;
  genres: string[];
}

function serializeBook(book: Book): StoredBook {
  return {
    id: book.id.value,
    title: book.title.value,
    authors: book.authors.map((author) => author.value),
    isbn: book.isbn?.value,
    status: book.status.value,
    rating: book.rating?.value,
    observation: book.observation,
    language: book.language?.value,
    favorited: book.favorited,
    cover: book.cover,
    genres: book.genres.map((genre) => genre.value),
  };
}

// Reads one stored field and rethrows any shape or domain failure with the
// book position, stored id, field name and received value, so a corrupted
// payload points at the exact broken field instead of a raw TypeError.
function deserializeField<T>(
  index: number,
  id: unknown,
  field: string,
  value: unknown,
  parse: () => T,
): T {
  try {
    return parse();
  } catch (originalError) {
    throw new Error(
      `Invalid book at index ${index} (id ${JSON.stringify(id)}): field "${field}" with value ${JSON.stringify(value)} is invalid (${(originalError as Error).message}).`,
      { cause: originalError },
    );
  }
}

// Reads a stored array field. The array shape is validated inside
// deserializeField (so a non-array points at the field itself), while each
// item is wrapped once on its own — item errors never nest inside a second
// field-level wrap.
function deserializeFieldArray<T>(
  index: number,
  id: unknown,
  field: string,
  raw: unknown,
  parseItem: (item: unknown) => T,
): T[] {
  const items = deserializeField(index, id, field, raw, () => {
    if (!Array.isArray(raw)) {
      throw new Error(`Expected ${field} to be an array.`);
    }
    return raw;
  });

  return items.map((item, itemIndex) =>
    deserializeField(index, id, `${field}[${itemIndex}]`, item, () => parseItem(item)),
  );
}

function deserializeBook(stored: StoredBook, index: number): Book {
  // JSON payloads are untrusted input: every field below is read through
  // deserializeField so a missing or wrong-typed value points at its book
  // position, stored id, field name and received value.
  if (typeof stored !== "object" || stored === null) {
    throw new Error(
      `Invalid book at index ${index}: expected a book object but found a different JSON shape.`,
    );
  }
  // A stored id that is not a valid UUID fails here and surfaces as
  // StorageCorruptedError — corrupted data, not a silently dropped book.
  const id = deserializeField(index, stored.id, "id", stored.id, () => {
    if (typeof stored.id !== "string" || stored.id.length === 0) {
      throw new Error("Book id must be a non-empty string.");
    }
    return Uuid.create(stored.id);
  });
  const title = deserializeField(index, stored.id, "title", stored.title, () => {
    if (typeof stored.title !== "string") {
      throw new Error("Book title must be a string.");
    }
    return Title.create(stored.title);
  });
  const authors = deserializeFieldArray(index, stored.id, "authors", stored.authors, (name) => {
    if (typeof name !== "string") {
      throw new Error("Each author must be a string.");
    }
    return Author.create(name);
  });
  const status = deserializeField(index, stored.id, "status", stored.status, () => {
    if (typeof stored.status !== "string") {
      throw new Error("Book status must be a string.");
    }
    return ReadingStatus.create(stored.status);
  });
  const isbn =
    stored.isbn === undefined
      ? undefined
      : deserializeField(index, stored.id, "isbn", stored.isbn, () => {
          if (typeof stored.isbn !== "string") {
            throw new Error("Book isbn must be a string.");
          }
          return ISBNValue.create(stored.isbn);
        });
  const rating =
    stored.rating === undefined
      ? undefined
      : deserializeField(index, stored.id, "rating", stored.rating, () => {
          if (typeof stored.rating !== "number") {
            throw new Error("Book rating must be a number.");
          }
          return Rating.create(stored.rating);
        });
  const observation = deserializeField(index, stored.id, "observation", stored.observation, () => {
    if (stored.observation !== undefined && typeof stored.observation !== "string") {
      throw new Error("Book observation must be a string.");
    }
    return stored.observation;
  });
  const language =
    stored.language === undefined
      ? undefined
      : deserializeField(index, stored.id, "language", stored.language, () => {
          if (typeof stored.language !== "string") {
            throw new Error("Book language must be a string.");
          }
          return Language.create(stored.language);
        });
  const favorited = deserializeField(index, stored.id, "favorited", stored.favorited, () => {
    if (stored.favorited !== undefined && typeof stored.favorited !== "boolean") {
      throw new Error("Book favorited must be a boolean.");
    }
    return stored.favorited;
  });
  const cover = deserializeField(index, stored.id, "cover", stored.cover, () => {
    if (stored.cover !== undefined && typeof stored.cover !== "string") {
      throw new Error("Book cover must be a string.");
    }
    return stored.cover;
  });
  const genres = deserializeFieldArray(index, stored.id, "genres", stored.genres, (item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new Error("Each genre must be a non-empty string.");
    }
    return GenreId.create(item);
  });

  return BookEntity.restore({
    id,
    title,
    authors,
    isbn,
    status,
    rating,
    observation,
    language,
    favorited,
    cover,
    genres,
  });
}

export class BookRepositoryLocalStorage implements BookRepository {
  private readonly storage: StorageLike;

  constructor(
    storage?: StorageLike,
    private readonly key: string = DEFAULT_STORAGE_KEY,
  ) {
    // In browsers localStorage is a global; the explicit storage parameter
    // keeps the adapter testable in Node and lets consumers use sessionStorage.
    this.storage = storage ?? (globalThis as { localStorage?: StorageLike }).localStorage!;

    if (!this.storage) {
      throw new Error(
        "No storage provided and localStorage is not available. Pass a StorageLike instance explicitly.",
      );
    }
  }

  async save(book: Book): Promise<void> {
    const books = this.readBooks();
    const index = books.findIndex((existing) => existing.id.value === book.id.value);

    if (index >= 0) {
      books[index] = book;
    } else {
      books.push(book);
    }

    this.writeBooks(books);
  }

  async findById(id: string): Promise<Book | undefined> {
    // Uuid stores ids normalized to lowercase, so the received id is
    // normalized the same way — a UUID differing only in case must still
    // match. Every BookRepository adapter applies this same rule.
    const normalizedId = id.toLowerCase();

    return this.readBooks().find((book) => book.id.value === normalizedId);
  }

  async getById(id: string): Promise<Book> {
    const book = await this.findById(id);

    if (!book) {
      throw new BookNotFoundError(id);
    }

    return book;
  }

  async findByIsbn(isbn: ISBN): Promise<Book | undefined> {
    return this.readBooks().find((book) => book.isbn?.value === isbn.value);
  }

  async findAll(): Promise<Book[]> {
    return this.readBooks();
  }

  async delete(id: string): Promise<void> {
    const normalizedId = id.toLowerCase();
    const books = this.readBooks();
    const remaining = books.filter((book) => book.id.value !== normalizedId);

    if (remaining.length === books.length) {
      throw new BookNotFoundError(id);
    }

    this.writeBooks(remaining);
  }

  // Invalid JSON or values that fail domain validation (e.g. an unknown
  // status) throw StorageCorruptedError instead of being silently dropped —
  // the consuming app decides how to recover.
  private readBooks(): Book[] {
    const raw = this.storage.getItem(this.key);

    if (raw === null) {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (cause) {
      throw new StorageCorruptedError(this.key, cause);
    }

    if (!Array.isArray(parsed)) {
      throw new StorageCorruptedError(
        this.key,
        new Error("Expected an array of books but found a different JSON shape."),
      );
    }

    try {
      return (parsed as StoredBook[]).map((stored, index) => deserializeBook(stored, index));
    } catch (cause) {
      throw new StorageCorruptedError(this.key, cause);
    }
  }

  private writeBooks(books: Book[]): void {
    this.storage.setItem(this.key, JSON.stringify(books.map(serializeBook)));
  }
}
