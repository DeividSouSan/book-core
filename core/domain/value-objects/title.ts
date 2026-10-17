import { EmptyTitleError } from "../errors/empty-title.error";

export class Title {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): Title {
    const title = receivedValue.trim();

    if (title.length === 0) {
      throw new EmptyTitleError(receivedValue);
    }

    return new Title(title);
  }

  equals(other: Title): boolean {
    return this.value === other.value;
  }
}
