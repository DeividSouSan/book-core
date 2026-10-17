import { describe, expect, it } from "vitest";
import {
  ENGLISH_TITLE_ARTICLES,
  PORTUGUESE_TITLE_ARTICLES,
  DEFAULT_TITLE_ARTICLES,
} from "../../../core/domain/value-objects/articles.constants";

describe("articles constants", () => {
  it("exposes English articles", () => {
    expect(ENGLISH_TITLE_ARTICLES).toEqual(["The", "A", "An"]);
  });

  it("exposes Portuguese articles", () => {
    expect(PORTUGUESE_TITLE_ARTICLES).toEqual(["O", "A", "Os", "As"]);
  });

  it("defaults merge both languages without duplicates", () => {
    expect(DEFAULT_TITLE_ARTICLES).toEqual(["The", "A", "An", "O", "A", "Os", "As"]);
  });
});
