import { Author } from "../value-objects/author";
import { Title } from "../value-objects/title";
import { ISBN } from "../value-objects/isbn";
import { ReadingStatus } from "../value-objects/reading-status";
import { Rating } from "../value-objects/rating";
import { Language } from "../value-objects/language";
import { TO_READ_STATUS } from "../value-objects/reading-status.constants";
import { randomUUID } from "node:crypto";

export class Book {
  private constructor(
    public readonly id: string,
    public readonly title: Title,
    public readonly authors: readonly Author[],
    public readonly isbn: ISBN,
    public readonly status: ReadingStatus,
    public readonly rating: Rating | undefined,
    public readonly observation: string | undefined,
    public readonly language: Language | undefined,
  ) {}

  static create(props: {
    title: string;
    authors: string[];
    isbn: string;
    status?: string;
    rating?: number;
    observation?: string;
    language?: string;
  }): Book {
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

    return new Book(
      randomUUID(),
      Title.create(props.title),
      authors,
      ISBN.create(props.isbn),
      status,
      props.rating !== undefined ? Rating.create(props.rating) : undefined,
      props.observation,
      props.language !== undefined ? Language.create(props.language) : undefined,
    );
  }

  // Reconstitution factory: rebuilds a Book from already-validated domain
  // objects (e.g. loaded from a repository). It does not generate a new id nor
  // re-validate — the data is trusted to have been validated when originally
  // created. Absent status restores to TO_READ so that data persisted before
  // the status field existed remains restorable.
  static restore(props: {
    id: string;
    title: Title;
    authors: Author[];
    isbn: ISBN;
    status?: ReadingStatus;
    rating?: Rating;
    observation?: string;
    language?: Language;
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
    );
  }

  equals(other: Book): boolean {
    return this.id === other.id;
  }
}
