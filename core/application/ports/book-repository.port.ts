import type { Book } from "../../domain/entities/book";
import type { ISBN } from "../../domain/value-objects/isbn";

export interface BookRepository {
  save(book: Book): Promise<void>;
  findById(id: string): Promise<Book | undefined>;
  getById(id: string): Promise<Book>;
  findByIsbn(isbn: ISBN): Promise<Book | undefined>;
  findAll(): Promise<Book[]>;
  delete(id: string): Promise<void>;
}
