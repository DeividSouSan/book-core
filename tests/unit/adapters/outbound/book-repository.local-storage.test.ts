import { describe, expect, it } from "vitest";
import { BookRepositoryLocalStorage } from "../../../../adapters/outbound/book-repository.local-storage";
import { StorageCorruptedError } from "../../../../adapters/outbound/storage-corrupted.error";
import { DEFAULT_STORAGE_KEY } from "../../../../adapters/outbound/book-repository.local-storage.constants";
import { Book } from "../../../../core/domain/entities/book";
import { Title } from "../../../../core/domain/value-objects/title";
import { Author } from "../../../../core/domain/value-objects/author";
import { ISBN } from "../../../../core/domain/value-objects/isbn";
import { ReadingStatus } from "../../../../core/domain/value-objects/reading-status";
import { Rating } from "../../../../core/domain/value-objects/rating";
import { Language } from "../../../../core/domain/value-objects/language";
import { BookNotFoundError } from "../../../../core/domain/errors/book-not-found.error";

// Minimal in-memory fake of the Web Storage API so the adapter is testable
// in Node (vitest environment) without jsdom or a real browser.
class FakeStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

function createBook(props?: {
  id?: string;
  title?: string;
  status?: string;
  rating?: number;
  observation?: string;
  language?: string;
}): Book {
  return Book.restore({
    id: props?.id ?? "fixed-id",
    title: Title.create(props?.title ?? "The Hobbit"),
    authors: [Author.create("J.R.R. Tolkien")],
    isbn: ISBN.create("978-0-261-10221-7"),
    status: ReadingStatus.create(props?.status ?? "TO_READ"),
    rating: props?.rating !== undefined ? Rating.create(props.rating) : undefined,
    observation: props?.observation,
    language: props?.language !== undefined ? Language.create(props.language) : undefined,
  });
}

describe("BookRepositoryLocalStorage", () => {
  describe("save and findById", () => {
    it("saves a book and retrieves it by id with every field preserved", async () => {
      const storage = new FakeStorage();
      const repository = new BookRepositoryLocalStorage(storage);
      const book = createBook({
        id: "fixed-id-1",
        status: "READ",
        rating: 5,
        observation: "Masterpiece",
        language: "en",
      });

      await repository.save(book);

      const found = await repository.findById("fixed-id-1");

      expect(found).toBeDefined();
      expect(found?.id).toBe("fixed-id-1");
      expect(found?.title.value).toBe("The Hobbit");
      expect(found?.authors[0].value).toBe("J.R.R. Tolkien");
      expect(found?.isbn.value).toBe("9780261102217");
      expect(found?.status.value).toBe("READ");
      expect(found?.rating?.value).toBe(5);
      expect(found?.observation).toBe("Masterpiece");
      expect(found?.language?.value).toBe("en");
    });

    it("returns undefined when book is not found", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());

      const found = await repository.findById("inexistent-id");

      expect(found).toBeUndefined();
    });

    it("overwrites the existing book when saving the same id", async () => {
      const storage = new FakeStorage();
      const repository = new BookRepositoryLocalStorage(storage);

      await repository.save(createBook({ id: "fixed-id-2", title: "First Title" }));
      await repository.save(createBook({ id: "fixed-id-2", title: "Second Title" }));

      const found = await repository.findById("fixed-id-2");

      expect(found?.title.value).toBe("Second Title");
    });
  });

  describe("getById", () => {
    it("returns the book when it exists", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());
      await repository.save(createBook({ id: "fixed-id-3" }));

      const found = await repository.getById("fixed-id-3");

      expect(found.id).toBe("fixed-id-3");
    });

    it("throws BookNotFoundError when book does not exist", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());

      await expect(repository.getById("inexistent-id")).rejects.toBeInstanceOf(BookNotFoundError);
    });
  });

  describe("findByIsbn", () => {
    it("finds a book by its ISBN", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());
      await repository.save(createBook({ id: "fixed-id-4" }));

      const found = await repository.findByIsbn(ISBN.create("9780261102217"));

      expect(found?.id).toBe("fixed-id-4");
    });

    it("returns undefined when ISBN is not found", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());

      const found = await repository.findByIsbn(ISBN.create("978-0-000-00000-2"));

      expect(found).toBeUndefined();
    });
  });

  describe("findAll", () => {
    it("returns an empty array when storage is empty", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());

      const all = await repository.findAll();

      expect(all).toEqual([]);
    });

    it("returns all saved books", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());
      await repository.save(createBook({ id: "fixed-id-5", title: "Book One" }));
      await repository.save(createBook({ id: "fixed-id-6", title: "Book Two" }));

      const all = await repository.findAll();

      expect(all.map((book) => book.title.value)).toEqual(["Book One", "Book Two"]);
    });

    it("restores a book persisted before the reading fields existed — status defaults to TO_READ", async () => {
      const storage = new FakeStorage();
      const repository = new BookRepositoryLocalStorage(storage);
      storage.setItem(
        DEFAULT_STORAGE_KEY,
        JSON.stringify([
          {
            id: "legacy-id",
            title: "The Hobbit",
            authors: ["J.R.R. Tolkien"],
            isbn: "9780261102217",
          },
        ]),
      );

      const found = await repository.findById("legacy-id");

      expect(found?.status.value).toBe("TO_READ");
      expect(found?.rating).toBeUndefined();
      expect(found?.observation).toBeUndefined();
      expect(found?.language).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("deletes a book by id", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());
      await repository.save(createBook({ id: "fixed-id-7" }));

      await repository.delete("fixed-id-7");

      expect(await repository.findById("fixed-id-7")).toBeUndefined();
    });

    it("throws BookNotFoundError when book does not exist", async () => {
      const repository = new BookRepositoryLocalStorage(new FakeStorage());

      await expect(repository.delete("inexistent-id")).rejects.toBeInstanceOf(BookNotFoundError);
    });
  });

  describe("corrupted data", () => {
    it("throws StorageCorruptedError when the stored value is not valid JSON", async () => {
      const storage = new FakeStorage();
      const repository = new BookRepositoryLocalStorage(storage);
      storage.setItem(DEFAULT_STORAGE_KEY, "{not valid json");

      const error = await repository.findAll().catch((e) => e);

      expect(error).toBeInstanceOf(StorageCorruptedError);
      expect((error as StorageCorruptedError).code).toBe("STORAGE.CORRUPTED");
      expect((error as StorageCorruptedError).key).toBe(DEFAULT_STORAGE_KEY);
    });

    it("throws StorageCorruptedError when a stored value fails domain validation", async () => {
      const storage = new FakeStorage();
      const repository = new BookRepositoryLocalStorage(storage);
      storage.setItem(
        DEFAULT_STORAGE_KEY,
        JSON.stringify([
          {
            id: "corrupted-id",
            title: "The Hobbit",
            authors: [],
            isbn: "9780261102217",
            status: "PAUSED",
          },
        ]),
      );

      const error = await repository.findAll().catch((e) => e);

      expect(error).toBeInstanceOf(StorageCorruptedError);
      expect((error as StorageCorruptedError).key).toBe(DEFAULT_STORAGE_KEY);
    });
  });
});
