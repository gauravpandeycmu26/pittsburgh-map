import { describe, expect, it } from "vitest";
import { toggleCategorySet } from "./categories.js";

describe("toggleCategorySet", () => {
  it("turns a category off when more than one is selected", () => {
    const current = new Set(["Parks", "Sports"]);
    expect([...toggleCategorySet(current, "Parks")]).toEqual(["Sports"]);
  });

  it("keeps the last remaining category on", () => {
    const current = new Set(["Parks"]);
    expect(toggleCategorySet(current, "Parks")).toBe(current);
  });

  it("turns a category back on", () => {
    const next = toggleCategorySet(new Set(["Parks"]), "Sports");
    expect(next.has("Parks")).toBe(true);
    expect(next.has("Sports")).toBe(true);
  });
});
