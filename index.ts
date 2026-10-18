// Public API of book-core. Consumers import from the package root:
//   import { Book, BookRepositoryLocalStorage } from "book-core";

// Domain — entity
export { Book } from "./core/domain/entities/book.js";

// Domain — value objects
export { ISBN } from "./core/domain/value-objects/isbn.js";
export type { ISBNFormat } from "./core/domain/value-objects/isbn.js";
export { Title } from "./core/domain/value-objects/title.js";
export { Author } from "./core/domain/value-objects/author.js";
export { Language } from "./core/domain/value-objects/language.js";
export { Uuid } from "./core/domain/value-objects/uuid.js";
export { GenreId } from "./core/domain/value-objects/genre-id.js";
export { ReadingStatus } from "./core/domain/value-objects/reading-status.js";
export { Rating } from "./core/domain/value-objects/rating.js";

// Domain — title sorting (replaceable suggestion)
export {
  removeLeadingArticles,
  defaultTitleSortKey,
} from "./core/domain/value-objects/sort-key.js";
export type { TitleSortKeyStrategy } from "./core/domain/value-objects/sort-key.js";

// Domain — constants (useful for UIs: ranges, supported values)
export * from "./core/domain/value-objects/isbn.constants.js";
export * from "./core/domain/value-objects/language.constants.js";
export * from "./core/domain/value-objects/uuid.constants.js";
export * from "./core/domain/value-objects/rating.constants.js";
export * from "./core/domain/value-objects/reading-status.constants.js";
export * from "./core/domain/value-objects/articles.constants.js";

// Domain — errors (all extend DomainError and carry a machine-readable code)
export { DomainError } from "./core/domain/errors/domain.error.js";
export { BookNotFoundError } from "./core/domain/errors/book-not-found.error.js";
export { EmptyISBNError } from "./core/domain/errors/empty-isbn.error.js";
export { InvalidISBNLengthError } from "./core/domain/errors/invalid-isbn-length.error.js";
export { InvalidISBNCharactersError } from "./core/domain/errors/invalid-isbn-characters.error.js";
export { InvalidISBNChecksumError } from "./core/domain/errors/invalid-isbn-checksum.error.js";
export { EmptyTitleError } from "./core/domain/errors/empty-title.error.js";
export { EmptyAuthorError } from "./core/domain/errors/empty-author.error.js";
export { EmptyGenreIdError } from "./core/domain/errors/empty-genre-id.error.js";
export { DuplicateGenreIdError } from "./core/domain/errors/duplicate-genre-id.error.js";
export { InvalidLanguageError } from "./core/domain/errors/invalid-language.error.js";
export { InvalidUuidError } from "./core/domain/errors/invalid-uuid.error.js";
export { InvalidReadingStatusError } from "./core/domain/errors/invalid-reading-status.error.js";
export { InvalidRatingError } from "./core/domain/errors/invalid-rating.error.js";

// Application — ports (interfaces for outbound adapters)
export type { BookRepository } from "./core/application/ports/book-repository.port.js";

// Adapters — outbound
export { BookRepositoryMemory } from "./adapters/outbound/book-repository.memory.js";
export { BookRepositoryLocalStorage } from "./adapters/outbound/book-repository.local-storage.js";
export type { StorageLike } from "./adapters/outbound/book-repository.local-storage.js";
export { DEFAULT_STORAGE_KEY } from "./adapters/outbound/book-repository.local-storage.constants.js";
export { StorageCorruptedError } from "./adapters/outbound/storage-corrupted.error.js";
