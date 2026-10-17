import { describe, expect, it } from "vitest";
import { BookRepositoryMemory } from "../../../../adapters/outbound/book-repository.memory";
import { Book } from "../../../../core/domain/entities/book";
import { Title } from "../../../../core/domain/value-objects/title";
import { Author } from "../../../../core/domain/value-objects/author";
import { ISBN } from "../../../../core/domain/value-objects/isbn";
import { BookNotFoundError } from "../../../../core/domain/errors/book-not-found.error";

function createBook(props?: {
  id?: string;
  title?: string;
  authors?: string[];
  isbn?: string;
}): Book {
  if (props?.id) {
    return Book.restore({
      id: props.id,
      title: Title.create(props.title ?? "The Hobbit"),
      authors: (props?.authors ?? ["J.R.R. Tolkien"]).map((name) => Author.create(name)),
      isbn: ISBN.create(props.isbn ?? "978-0-261-10221-7"),
    });
  }

  return Book.create({
    title: props?.title ?? "The Hobbit",
    authors: props?.authors ?? ["J.R.R. Tolkien"],
    isbn: props?.isbn ?? "978-0-261-10221-7",
  });
}

describe("BookRepositoryMemory", () => {
  describe("save and findById", () => {
    it("saves a book and retrieves it by id", async () => {
      const repository = new BookRepositoryMemory();
      const book = createBook({ id: "fixed-id-1" });

      await repository.save(book);

      const found = await repository.findById("fixed-id-1");

      expect(found).toBeDefined();
      expect(found?.id).toBe("fixed-id-1");
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
      const book = createBook({ id: "fixed-id-2" });

      await repository.save(book);

      const found = await repository.getById("fixed-id-2");

      expect(found.id).toBe("fixed-id-2");
      expect(found.title.value).toBe("The Hobbit");
    });
  });

  describe("save with same id", () => {
    it("overwrites the existing book", async () => {
      const repository = new BookRepositoryMemory();
      const first = createBook({ id: "fixed-id-3", title: "First Title" });
      const second = createBook({ id: "fixed-id-3", title: "Second Title" });

      await repository.save(first);
      await repository.save(second);

      const found = await repository.findById("fixed-id-3");

      expect(found?.title.value).toBe("Second Title");
    });
  });

  describe("findByIsbn", () => {
    it("finds a book by its ISBN", async () => {
      const repository = new BookRepositoryMemory();
      const book = createBook({ id: "fixed-id-4", isbn: "978-0-261-10221-7" });

      await repository.save(book);

      const found = await repository.findByIsbn(ISBN.create("9780261102217"));

      expect(found).toBeDefined();
      expect(found?.id).toBe("fixed-id-4");
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
      const book1 = createBook({ id: "fixed-id-5", title: "Book One" });
      const book2 = createBook({ id: "fixed-id-6", title: "Book Two" });

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
      const book = createBook({ id: "fixed-id-7" });

      await repository.save(book);
      await repository.delete("fixed-id-7");

      const found = await repository.findById("fixed-id-7");

      expect(found).toBeUndefined();
    });

    it("delete throws BookNotFoundError when book does not exist", async () => {
      const repository = new BookRepositoryMemory();

      await expect(repository.delete("inexistent-id")).rejects.toBeInstanceOf(BookNotFoundError);
    });
  });
});
