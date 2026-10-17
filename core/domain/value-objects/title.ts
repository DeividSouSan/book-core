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
   * Título normalizado para ordenação de catálogo.
   *
   * Por padrão ignora artigos iniciais (ex.: "The Starless Sea" → "Starless Sea").
   * O consumidor pode injetar outra estratégia se a sugestão do núcleo não atender.
   */
  sortKey(strategy: TitleSortKeyStrategy = defaultTitleSortKey): string {
    return strategy(this.value);
  }

  equals(other: Title): boolean {
    return this.value === other.value;
  }
}
