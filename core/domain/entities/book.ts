import { Author } from "../value-objects/author";
import { Title } from "../value-objects/title";
import { ISBN } from "../value-objects/isbn";
import { randomUUID } from "node:crypto";

export class Book {
  private constructor(
    public readonly id: string,
    public readonly title: Title,
    public readonly authors: readonly Author[],
    public readonly isbn: ISBN,
  ) {}

  static create(props: { title: string; authors: string[]; isbn: string }): Book {
    // Empty authors list is a valid catalogue state ("author not yet known"):
    // each listed author is validated individually, but "unknown author" is a
    // legitimate state of catalogue data — requiring ≥1 author would push the
    // consumer toward fake placeholders like "Unknown". If a consumer wants an
    // author-mandatory rule, that is its business rule, not a domain invariant.
    const authors = props.authors.map((authorName) => Author.create(authorName));

    return new Book(randomUUID(), Title.create(props.title), authors, ISBN.create(props.isbn));
  }

  // Reconstitution factory: rebuilds a Book from already-validated domain
  // objects (e.g. loaded from a repository). It does not generate a new id nor
  // re-validate — the data is trusted to have been validated when originally
  // created.
  static restore(props: { id: string; title: Title; authors: Author[]; isbn: ISBN }): Book {
    return new Book(props.id, props.title, props.authors, props.isbn);
  }

  equals(other: Book): boolean {
    return this.id === other.id;
  }
}
