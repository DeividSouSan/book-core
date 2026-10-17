import type { Book } from "../../core/domain/entities/book.js";
import type { ISBN } from "../../core/domain/value-objects/isbn.js";
import type { BookRepository } from "../../core/application/ports/book-repository.port.js";
import { BookNotFoundError } from "../../core/domain/errors/book-not-found.error.js";
import { Book as BookEntity } from "../../core/domain/entities/book.js";
import { Title } from "../../core/domain/value-objects/title.js";
import { Author } from "../../core/domain/value-objects/author.js";
import { ISBN as ISBNValue } from "../../core/domain/value-objects/isbn.js";
import { ReadingStatus } from "../../core/domain/value-objects/reading-status.js";
import { Rating } from "../../core/domain/value-objects/rating.js";
import { Language } from "../../core/domain/value-objects/language.js";
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
  isbn: string;
  status?: string;
  rating?: number;
  observation?: string;
  language?: string;
}

function serializeBook(book: Book): StoredBook {
  return {
    id: book.id,
    title: book.title.value,
    authors: book.authors.map((author) => author.value),
    isbn: book.isbn.value,
    status: book.status.value,
    rating: book.rating?.value,
    observation: book.observation,
    language: book.language?.value,
  };
}

function deserializeBook(stored: StoredBook): Book {
  return BookEntity.restore({
    id: stored.id,
    title: Title.create(stored.title),
    authors: stored.authors.map((name) => Author.create(name)),
    isbn: ISBNValue.create(stored.isbn),
    // Absent status means the record predates the field: restore() applies the
    // TO_READ default instead of failing on undefined.
    status: stored.status !== undefined ? ReadingStatus.create(stored.status) : undefined,
    rating: stored.rating !== undefined ? Rating.create(stored.rating) : undefined,
    observation: stored.observation,
    language: stored.language !== undefined ? Language.create(stored.language) : undefined,
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
    const index = books.findIndex((existing) => existing.id === book.id);

    if (index >= 0) {
      books[index] = book;
    } else {
      books.push(book);
    }

    this.writeBooks(books);
  }

  async findById(id: string): Promise<Book | undefined> {
    return this.readBooks().find((book) => book.id === id);
  }

  async getById(id: string): Promise<Book> {
    const book = await this.findById(id);

    if (!book) {
      throw new BookNotFoundError(id);
    }

    return book;
  }

  async findByIsbn(isbn: ISBN): Promise<Book | undefined> {
    return this.readBooks().find((book) => book.isbn.value === isbn.value);
  }

  async findAll(): Promise<Book[]> {
    return this.readBooks();
  }

  async delete(id: string): Promise<void> {
    const books = this.readBooks();
    const remaining = books.filter((book) => book.id !== id);

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
      return (parsed as StoredBook[]).map(deserializeBook);
    } catch (cause) {
      throw new StorageCorruptedError(this.key, cause);
    }
  }

  private writeBooks(books: Book[]): void {
    this.storage.setItem(this.key, JSON.stringify(books.map(serializeBook)));
  }
}
