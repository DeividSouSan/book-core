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

    // Converte cada gênero via GenreId.create (propaga EmptyGenreIdError),
    // rejeita duplicatas por valor exato (case-sensitive) e guarda uma cópia
    // nova do array, imune a mutações posteriores do array de entrada.
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
      // ISBN é opcional: um app casual pode não ter o ISBN do livro em mãos.
      // Quando informado, valida normalmente; quando ausente, fica undefined.
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
  // created. Absent status restores to TO_READ so that data persisted before
  // the status field existed remains restorable.
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
      props.authors,
      props.isbn,
      props.status ?? ReadingStatus.create(TO_READ_STATUS),
      props.rating,
      props.observation,
      props.language,
      props.favorited,
      props.cover,
      props.genres ?? [],
    );
  }

  equals(other: Book): boolean {
    return this.id.equals(other.id);
  }
}

// Rejeita identificadores de gênero repetidos em create.
// A comparação é exata (case-sensitive): \"Fantasy\" e \"fantasy\" são ids
// distintos e não lançam erro. O primeiro lançamento aponta o valor duplicado.
function ensureNoDuplicateGenreIds(genreIds: readonly GenreId[]): void {
  const seen = new Set<string>();
  for (const genre of genreIds) {
    if (seen.has(genre.value)) {
      throw new DuplicateGenreIdError(genre.value);
    }
    seen.add(genre.value);
  }
}
