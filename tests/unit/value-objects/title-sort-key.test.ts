import { describe, expect, it } from "vitest";
import { Title } from "../../../core/domain/value-objects/title";
import { defaultTitleSortKey } from "../../../core/domain/value-objects/sort-key";

describe("Title.sortKey", () => {
  it("returns the default sort key when no strategy is given", () => {
    const title = Title.create("The Starless Sea");

    expect(title.sortKey()).toBe(defaultTitleSortKey("The Starless Sea"));
    expect(title.sortKey()).toBe("Starless Sea");
  });

  it("applies a custom strategy when provided", () => {
    const title = Title.create("O Alienista");

    const keepEverything = (t: string) => t;
    expect(title.sortKey(keepEverything)).toBe("O Alienista");
  });

  it("does not affect equals or value", () => {
    const title = Title.create("The Starless Sea");

    expect(title.value).toBe("The Starless Sea");
    expect(title.equals(Title.create("The Starless Sea"))).toBe(true);
    expect(title.sortKey()).toBe("Starless Sea");
  });
});
