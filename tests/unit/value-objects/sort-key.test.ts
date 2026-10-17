import { describe, expect, it } from "vitest";
import {
  removeLeadingArticles,
  defaultTitleSortKey,
  type TitleSortKeyStrategy,
} from "../../../core/domain/value-objects/sort-key";
import {
  ENGLISH_TITLE_ARTICLES,
  PORTUGUESE_TITLE_ARTICLES,
  DEFAULT_TITLE_ARTICLES,
} from "../../../core/domain/value-objects/articles.constants";

function sortWith(strategy: TitleSortKeyStrategy, titles: string[]): string[] {
  return [...titles].sort((a, b) => strategy(a).localeCompare(strategy(b)));
}

describe("removeLeadingArticles", () => {
  it("removes English articles at the start, case insensitive", () => {
    expect(removeLeadingArticles("The Starless Sea", ENGLISH_TITLE_ARTICLES)).toBe("Starless Sea");
    expect(removeLeadingArticles("a Wrinkle in Time", ENGLISH_TITLE_ARTICLES)).toBe(
      "Wrinkle in Time",
    );
    expect(removeLeadingArticles("Anansi Boys", ENGLISH_TITLE_ARTICLES)).toBe("Anansi Boys");
  });

  it("removes Portuguese articles at the start, case insensitive", () => {
    expect(removeLeadingArticles("O Cortiço", PORTUGUESE_TITLE_ARTICLES)).toBe("Cortiço");
    expect(removeLeadingArticles("a Hora da Estrela", PORTUGUESE_TITLE_ARTICLES)).toBe(
      "Hora da Estrela",
    );
    expect(removeLeadingArticles("As Crônicas de Nárnia", PORTUGUESE_TITLE_ARTICLES)).toBe(
      "Crônicas de Nárnia",
    );
  });

  it("does not remove articles in the middle of the title", () => {
    expect(removeLeadingArticles("The Sound and the Fury", ENGLISH_TITLE_ARTICLES)).toBe(
      "Sound and the Fury",
    );
    expect(removeLeadingArticles("O Alienista", PORTUGUESE_TITLE_ARTICLES)).toBe("Alienista");
  });

  it("returns the title unchanged when it has no leading article", () => {
    expect(removeLeadingArticles("Duna", DEFAULT_TITLE_ARTICLES)).toBe("Duna");
    expect(removeLeadingArticles("1984", DEFAULT_TITLE_ARTICLES)).toBe("1984");
  });

  it("trims extra spaces after removing the article", () => {
    expect(removeLeadingArticles("  The   Hobbit", ENGLISH_TITLE_ARTICLES)).toBe("Hobbit");
  });
});

describe("defaultTitleSortKey", () => {
  it("applies DEFAULT_TITLE_ARTICLES by default", () => {
    expect(defaultTitleSortKey("The Starless Sea")).toBe("Starless Sea");
    expect(defaultTitleSortKey("O Alienista")).toBe("Alienista");
  });
});

describe("sorting with a custom strategy", () => {
  it("allows replacing the default rule entirely", () => {
    const onlyThe = (title: string) => title.replace(/^The\s+/i, "");

    expect(sortWith(onlyThe, ["The Hobbit", "A Wizard of Earthsea"])).toEqual([
      "A Wizard of Earthsea",
      "The Hobbit",
    ]);
  });
});
