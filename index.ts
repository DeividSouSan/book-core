// Public API of book-core. Consumers import from the package root:
//   import { Book, BookRepositoryLocalStorage } from "book-core";

// Domain — entity
export { Book } from "./core/domain/entities/book";

// Domain — value objects
export { ISBN } from "./core/domain/value-objects/isbn";
export type { ISBNFormat } from "./core/domain/value-objects/isbn";
export { Title } from "./core/domain/value-objects/title";
export { Author } from "./core/domain/value-objects/author";
export { Language } from "./core/domain/value-objects/language";
export { ReadingStatus } from "./core/domain/value-objects/reading-status";
export { Rating } from "./core/domain/value-objects/rating";

// Domain — title sorting (replaceable suggestion)
export { removeLeadingArticles, defaultTitleSortKey } from "./core/domain/value-objects/sort-key";
export type { TitleSortKeyStrategy } from "./core/domain/value-objects/sort-key";

// Domain — constants (useful for UIs: ranges, supported values)
export * from "./core/domain/value-objects/isbn.constants";
export * from "./core/domain/value-objects/language.constants";
export * from "./core/domain/value-objects/rating.constants";
export * from "./core/domain/value-objects/reading-status.constants";
export * from "./core/domain/value-objects/articles.constants";

// Domain — errors (all extend DomainError and carry a machine-readable code)
export { DomainError } from "./core/domain/errors/domain.error";
export { BookNotFoundError } from "./core/domain/errors/book-not-found.error";
export { EmptyISBNError } from "./core/domain/errors/empty-isbn.error";
export { InvalidISBNLengthError } from "./core/domain/errors/invalid-isbn-length.error";
export { InvalidISBNCharactersError } from "./core/domain/errors/invalid-isbn-characters.error";
export { InvalidISBNChecksumError } from "./core/domain/errors/invalid-isbn-checksum.error";
export { EmptyTitleError } from "./core/domain/errors/empty-title.error";
export { EmptyAuthorError } from "./core/domain/errors/empty-author.error";
export { InvalidLanguageError } from "./core/domain/errors/invalid-language.error";
export { InvalidReadingStatusError } from "./core/domain/errors/invalid-reading-status.error";
export { InvalidRatingError } from "./core/domain/errors/invalid-rating.error";

// Application — ports (interfaces for outbound adapters)
export type { BookRepository } from "./core/application/ports/book-repository.port";

// Adapters — outbound
export { BookRepositoryMemory } from "./adapters/outbound/book-repository.memory";
export { BookRepositoryLocalStorage } from "./adapters/outbound/book-repository.local-storage";
export type { StorageLike } from "./adapters/outbound/book-repository.local-storage";
export { DEFAULT_STORAGE_KEY } from "./adapters/outbound/book-repository.local-storage.constants";
export { StorageCorruptedError } from "./adapters/outbound/storage-corrupted.error";
