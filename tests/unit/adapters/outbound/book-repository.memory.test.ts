import { describe, expect, it } from "vitest";
import { BookRepositoryMemory } from "../../../../adapters/outbound/book-repository.memory";
import { Book } from "../../../../core/domain/entities/book";
import { Title } from "../../../../core/domain/value-objects/title";
import { Author } from "../../../../core/domain/value-objects/author";
import { ISBN } from "../../../../core/domain/value-objects/isbn";
import { Uuid } from "../../../../core/domain/value-objects/uuid";
import { BookNotFoundError } from "../../../../core/domain/errors/book-not-found.error";

const DEFAULT_UUID = "550e8400-e29b-41d4-a716-446655440000";

function createBook(props?: {
  id?: string;
  title?: string;
  authors?: string[];
  isbn?: string;
}): Book {
  if (props?.id) {
    return Book.restore({
      id: Uuid.create(props.id),
      title: Title.create(props.title ?? "The Hobbit"),
      authors: (props?.authors ?? ["J.R.R. Tolkien"]).map((name) => Author.create(name)),
      isbn: ISBN.create(props.isbn ?? "978-0-261-10221-7"),
    });
  }

  return Book.create(
    {
      title: props?.title ?? "The Hobbit",
      authors: props?.authors ?? ["J.R.R. Tolkien"],
      isbn: props?.isbn ?? "978-0-261-10221-7",
    },
    DEFAULT_UUID,
  );
}

describe("BookRepositoryMemory", () => {
  describe("save and findById", () => {
    it("saves a book and retrieves it by id", async () => {
      const repository = new BookRepositoryMemory();
      const book = createBook({ id: "11111111-1111-4111-8111-111111111111" });

      await repository.save(book);

      const found = await repository.findById("11111111-1111-4111-8111-111111111111");

      expect(found).toBeDefined();
      expect(found?.id.value).toBe("11111111-1111-4111-8111-111111111111");
      expect(found?.title.value).toBe("The Hobbit");
    });

    it("returns undefined when book is not found by id", async () => {
      const repository = new BookRepositoryMemory();

      const found = await repository.findById("inexistent-id");

      expect(found).toBeUndefined();
    });

    it("getById throws BookNotFoundError when book does not exist", async () => {
      const repository = new BookRepositoryMemory();

      await expect(repository.getById("inexistent-id")).rejects.toBeInstanceOf(BookNotFoundError);
    });

    it("getById returns the book when it exists", async () => {
      const repository = new BookRepositoryMemory();
      const book = createBook({ id: "22222222-2222-4222-8222-222222222222" });

      await repository.save(book);

      const found = await repository.getById("22222222-2222-4222-8222-222222222222");

      expect(found.id.value).toBe("22222222-2222-4222-8222-222222222222");
      expect(found.title.value).toBe("The Hobbit");
    });
  });

  describe("save with same id", () => {
    it("overwrites the existing book", async () => {
      const repository = new BookRepositoryMemory();
      const first = createBook({
        id: "33333333-3333-4333-8333-333333333333",
        title: "First Title",
      });
      const second = createBook({
        id: "33333333-3333-4333-8333-333333333333",
        title: "Second Title",
      });

      await repository.save(first);
      await repository.save(second);

      const found = await repository.findById("33333333-3333-4333-8333-333333333333");

      expect(found?.title.value).toBe("Second Title");
    });
  });

  describe("findByIsbn", () => {
    it("finds a book by its ISBN", async () => {
      const repository = new BookRepositoryMemory();
      const book = createBook({
        id: "44444444-4444-4444-8444-444444444444",
        isbn: "978-0-261-10221-7",
      });

      await repository.save(book);

      const found = await repository.findByIsbn(ISBN.create("9780261102217"));

      expect(found).toBeDefined();
      expect(found?.id.value).toBe("44444444-4444-4444-8444-444444444444");
    });

    it("returns undefined when ISBN is not found", async () => {
      const repository = new BookRepositoryMemory();

      const found = await repository.findByIsbn(ISBN.create("978-0-000-00000-2"));

      expect(found).toBeUndefined();
    });
  });

  describe("findAll", () => {
    it("returns all saved books", async () => {
      const repository = new BookRepositoryMemory();
      const book1 = createBook({ id: "55555555-5555-4555-8555-555555555555", title: "Book One" });
      const book2 = createBook({ id: "66666666-6666-4666-8666-666666666666", title: "Book Two" });

      await repository.save(book1);
      await repository.save(book2);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all.map((b) => b.title.value)).toEqual(["Book One", "Book Two"]);
    });

    it("returns empty array when no books are saved", async () => {
      const repository = new BookRepositoryMemory();

      const all = await repository.findAll();

      expect(all).toEqual([]);
    });
  });

  describe("delete", () => {
    it("deletes a book by id", async () => {
      const repository = new BookRepositoryMemory();
      const book = createBook({ id: "77777777-7777-4777-8777-777777777777" });

      await repository.save(book);
      await repository.delete("77777777-7777-4777-8777-777777777777");

      const found = await repository.findById("77777777-7777-4777-8777-777777777777");

      expect(found).toBeUndefined();
    });

    it("delete throws BookNotFoundError when book does not exist", async () => {
      const repository = new BookRepositoryMemory();

      await expect(repository.delete("inexistent-id")).rejects.toBeInstanceOf(BookNotFoundError);
    });
  });
});
