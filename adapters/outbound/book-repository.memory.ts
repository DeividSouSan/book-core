import type { Book } from "../../core/domain/entities/book.js";
import type { ISBN } from "../../core/domain/value-objects/isbn.js";
import { BookRepository } from "../../core/application/ports/book-repository.port.js";
import { BookNotFoundError } from "../../core/domain/errors/book-not-found.error.js";

export class BookRepositoryMemory implements BookRepository {
  private readonly books = new Map<string, Book>();

  async save(book: Book): Promise<void> {
    this.books.set(book.id.value, book);
  }

  async findById(id: string): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getById(id: string): Promise<Book> {
    const book = this.books.get(id);

    if (!book) {
      throw new BookNotFoundError(id);
    }

    return book;
  }

  async findByIsbn(isbn: ISBN): Promise<Book | undefined> {
    for (const book of this.books.values()) {
      if (book.isbn.value === isbn.value) {
        return book;
      }
    }

    return undefined;
  }

  async findAll(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async delete(id: string): Promise<void> {
    if (!this.books.has(id)) {
      throw new BookNotFoundError(id);
    }

    this.books.delete(id);
  }
}
