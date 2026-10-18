import { Author } from "../value-objects/author.js";
import { Title } from "../value-objects/title.js";
import { ISBN } from "../value-objects/isbn.js";
import { ReadingStatus } from "../value-objects/reading-status.js";
import { Rating } from "../value-objects/rating.js";
import { Language } from "../value-objects/language.js";
import { Uuid } from "../value-objects/uuid.js";
import { GenreId } from "../value-objects/genre-id.js";
import { TO_READ_STATUS } from "../value-objects/reading-status.constants.js";
import { DuplicateGenreIdError } from "../errors/duplicate-genre-id.error.js";
import { EmptyCoverError } from "../errors/empty-cover.error.js";

// Fields a book can change after creation. Each with*/without* method feeds
// this partial with already-validated domain values, so copyWith only has to
// assemble the new book.
type BookChanges = Partial<
  Pick<
    Book,
    | "title"
    | "authors"
    | "isbn"
    | "status"
    | "rating"
    | "observation"
    | "language"
    | "favorited"
    | "cover"
    | "genres"
  >
>;

export class Book {
  private constructor(
    public readonly id: Uuid,
    public readonly title: Title,
    public readonly authors: readonly Author[],
    public readonly isbn: ISBN | undefined,
    public readonly status: ReadingStatus,
    public readonly rating: Rating | undefined,
    public readonly observation: string | undefined,
    public readonly language: Language | undefined,
    // favorited is a plain boolean with no domain validation — a book is either
    // marked as a favorite or it is not, and absence means "not favorited".
    public readonly favorited: boolean | undefined,
    // cover is a plain image URL with no domain validation beyond trimming
    // surrounding whitespace. Absence means "no cover".
    public readonly cover: string | undefined,
    public readonly genres: readonly GenreId[],
  ) {}

  // The caller generates the id and injects it: the domain never touches a
  // runtime random API (node:crypto, WebCrypto), staying framework-independent.
  // Uuid.create validates the injected value, so an invalid id never exists.
  static create(
    props: {
      title: string;
      authors: string[];
      isbn?: string;
      status?: string;
      rating?: number;
      observation?: string;
      language?: string;
      favorited?: boolean;
      cover?: string;
      genres?: string[];
    },
    id: string,
  ): Book {
    // Empty authors list is a valid catalogue state ("author not yet known"):
    // each listed author is validated individually, but "unknown author" is a
    // legitimate state of catalogue data — requiring ≥1 author would push the
    // consumer toward fake placeholders like "Unknown". If a consumer wants an
    // author-mandatory rule, that is its business rule, not a domain invariant.
    const authors = props.authors.map((authorName) => Author.create(authorName));

    // A newly registered book defaults to "to read": the consumer only sets a
    // status when the reading flow has actually started. Rating, observation
    // and language are optional — a book can be registered before any of them
    // is known, and enforcing them would impose app-level rules on the core.
    const status = ReadingStatus.create(props.status ?? TO_READ_STATUS);

    // Converts each genre via GenreId.create (propagates EmptyGenreIdError),
    // rejects exact-value duplicates (case-sensitive) and stores a fresh copy
    // of the array, immune to later mutations of the input array.
    const genreIds = (props.genres ?? []).map((name) => GenreId.create(name));
    ensureNoDuplicateGenreIds(genreIds);

    // Cover is trimmed like Title/Author; an empty or whitespace-only cover
    // is rejected the same way other value objects reject blank input.
    const cover =
      props.cover !== undefined
        ? (() => {
            const trimmed = props.cover.trim();
            if (trimmed.length === 0) {
              throw new EmptyCoverError(props.cover);
            }
            return trimmed;
          })()
        : undefined;

    return new Book(
      Uuid.create(id),
      Title.create(props.title),
      authors,
      // ISBN is optional: a casual app may not have the book's ISBN at hand.
      // When provided it validates as usual; when absent it stays undefined.
      props.isbn !== undefined ? ISBN.create(props.isbn) : undefined,
      status,
      props.rating !== undefined ? Rating.create(props.rating) : undefined,
      props.observation,
      props.language !== undefined ? Language.create(props.language) : undefined,
      props.favorited,
      cover,
      [...genreIds],
    );
  }

  // Reconstitution factory: rebuilds a Book from already-validated domain
  // objects (e.g. loaded from a repository). It does not generate a new id nor
  // re-validate — the data is trusted to have been validated when originally
  // created. To change a book, use the with* methods; restore only rehydrates
  // persisted data (adapters) and trusts it without re-validating.
  static restore(props: {
    id: Uuid;
    title: Title;
    authors: Author[];
    isbn?: ISBN;
    status?: ReadingStatus;
    rating?: Rating;
    observation?: string;
    language?: Language;
    favorited?: boolean;
    cover?: string;
    genres?: GenreId[];
  }): Book {
    return new Book(
      props.id,
      props.title,
      // Defensive copies: readonly is compile-time only, so the input arrays
      // are copied to keep the book immune to later mutations of the caller's
      // arrays (and vice versa) — mirroring create().
      [...props.authors],
      props.isbn,
      props.status ?? ReadingStatus.create(TO_READ_STATUS),
      props.rating,
      props.observation,
      props.language,
      props.favorited,
      props.cover,
      [...(props.genres ?? [])],
    );
  }

  equals(other: Book): boolean {
    return this.id.equals(other.id);
  }

  withTitle(title: string): Book {
    return this.copyWith({ title: Title.create(title) });
  }

  withRating(rating: number): Book {
    return this.copyWith({ rating: Rating.create(rating) });
  }

  withoutRating(): Book {
    return this.copyWith({ rating: undefined });
  }

  withGenre(genre: string): Book {
    const genreId = GenreId.create(genre);
    // Same exact-match rule as create: silently accepting a genre the book
    // already has would hide a data error from the consumer.
    ensureNoDuplicateGenreIds([...this.genres, genreId]);
    return this.copyWith({ genres: [...this.genres, genreId] });
  }

  // Removing a genre the book does not have is a no-op, not an error: the book
  // is already in the desired state. Whether a genre "should not be here" is a
  // consumer rule, not a domain invariant.
  withoutGenre(genre: string): Book {
    const genreId = GenreId.create(genre);
    return this.copyWith({
      genres: this.genres.filter((existing) => !existing.equals(genreId)),
    });
  }

  // Single place where a Book is rebuilt with replaced fields: listed fields
  // overwrite the current values, unlisted fields keep them (an explicit
  // `undefined` erases an optional field, e.g. withoutRating).
  // Arrays are always copied — `readonly` is compile-time only, so sharing an
  // array between two books would reintroduce array aliasing: mutating one
  // book's authors/genres would silently corrupt the other.
  private copyWith(changes: BookChanges): Book {
    const next = { ...this, ...changes };
    // Required fields are resolved explicitly: they can only be replaced, never
    // erased. Optional fields come from the merge so `undefined` erases them.
    return new Book(
      this.id,
      changes.title ?? this.title,
      [...(changes.authors ?? this.authors)],
      next.isbn,
      changes.status ?? this.status,
      next.rating,
      next.observation,
      next.language,
      next.favorited,
      next.cover,
      [...(changes.genres ?? this.genres)],
    );
  }
}

// Rejects repeated genre identifiers (create and withGenre).
// The comparison is exact (case-sensitive): "Fantasy" and "fantasy" are
// distinct ids and do not throw. The first throw points at the duplicated value.
function ensureNoDuplicateGenreIds(genreIds: readonly GenreId[]): void {
  const seen = new Set<string>();
  for (const genre of genreIds) {
    if (seen.has(genre.value)) {
      throw new DuplicateGenreIdError(genre.value);
    }
    seen.add(genre.value);
  }
}
