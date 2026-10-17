import { EmptyTitleError } from "../errors/empty-title.error";
import { defaultTitleSortKey } from "./sort-key";
import type { TitleSortKeyStrategy } from "./sort-key";

export class Title {
  private constructor(public readonly value: string) {}

  static create(receivedValue: string): Title {
    const title = receivedValue.trim();

    if (title.length === 0) {
      throw new EmptyTitleError(receivedValue);
    }

    return new Title(title);
  }

  /**
   * Title normalized for catalogue sorting.
   *
   * By default ignores leading articles (ex.: "The Starless Sea" → "Starless Sea").
   * The consumer can inject another strategy if the core's suggestion does not fit.
   */
  sortKey(strategy: TitleSortKeyStrategy = defaultTitleSortKey): string {
    return strategy(this.value);
  }

  equals(other: Title): boolean {
    return this.value === other.value;
  }
}
