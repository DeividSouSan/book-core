import { EmptyAuthorError } from "../errors/empty-author.error.js";

export class Author {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): Author {
    const author = receivedValue.trim();

    if (author.length === 0) {
      throw new EmptyAuthorError(receivedValue);
    }

    return new Author(author);
  }

  equals(other: Author): boolean {
    return this.value === other.value;
  }
}
