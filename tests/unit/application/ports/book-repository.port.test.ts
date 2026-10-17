import { describe, expect, it } from "vitest";
import { BookNotFoundError } from "../../../../core/domain/errors/book-not-found.error";
import type { Book } from "../../../../core/domain/entities/book";
import { Title } from "../../../../core/domain/value-objects/title";
import { ISBN } from "../../../../core/domain/value-objects/isbn";
import type { BookRepository } from "../../../../core/application/ports/book-repository.port";

const mockBook: Book = {
  id: "mock-id",
  title: Title.create("Mock Title"),
  authors: [],
  isbn: ISBN.create("9780261102217"),
  equals: () => true,
} as Book;

// Mock mínimo para validar o contrato da porta sem depender de adaptador concreto.
const mockBookRepository: BookRepository = {
  save: async () => {},
  findById: async () => undefined,
  getById: async () => {
    throw new BookNotFoundError("id-inexistente");
  },
  findByIsbn: async () => undefined,
  findAll: async () => [],
  delete: async () => {},
};

describe("BookRepository port", () => {
  it("is implemented by a mock object without type errors", async () => {
    await expect(mockBookRepository.save(mockBook)).resolves.toBeUndefined();
    await expect(mockBookRepository.findById("qualquer-id")).resolves.toBeUndefined();
    await expect(mockBookRepository.findAll()).resolves.toEqual([]);
    await expect(mockBookRepository.delete("qualquer-id")).resolves.toBeUndefined();
  });

  it("getById throws BookNotFoundError when book does not exist", async () => {
    const error = await mockBookRepository.getById("id-inexistente").catch((e) => e);

    expect(error).toBeInstanceOf(BookNotFoundError);
    expect((error as BookNotFoundError).code).toBe("BOOK.NOT_FOUND");
    expect((error as BookNotFoundError).bookId).toBe("id-inexistente");
  });
});
