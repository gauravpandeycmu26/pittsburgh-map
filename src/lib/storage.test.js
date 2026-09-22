import { beforeEach, describe, expect, it } from "vitest";
import { seedReviews } from "../data/seedReviews.js";
import { averageRating, createId, loadStore, reviewsFor, saveStore } from "./storage.js";

describe("averageRating", () => {
  it("returns 0 for an empty list", () => {
    expect(averageRating([])).toBe(0);
  });

  it("averages 1-5 scores", () => {
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 3 }])).toBe(4);
  });
});

describe("reviewsFor", () => {
  it("includes seed reviews and sorts newest first", () => {
    const list = reviewsFor("point-state-park", {});
    expect(list.map((review) => review.id)).toEqual(["seed-point-2", "seed-point-1"]);
    expect(list).toHaveLength(seedReviews["point-state-park"].length);
  });

  it("merges user reviews with seeds", () => {
    const user = {
      "point-state-park": [
        { id: "user-1", author: "Gaurav", rating: 5, text: "Great lights.", createdAt: 1800000000000 },
      ],
    };
    const list = reviewsFor("point-state-park", user);
    expect(list[0].id).toBe("user-1");
    expect(list).toHaveLength(3);
  });

  it("returns only user reviews when a place has no seeds", () => {
    const user = {
      "ppg-place": [{ id: "user-2", author: "A", rating: 3, text: "Nice glass.", createdAt: 1 }],
    };
    expect(reviewsFor("ppg-place", user)).toHaveLength(1);
  });
});

describe("loadStore and saveStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty collections when nothing is saved", () => {
    expect(loadStore()).toEqual({ customPlaces: [], userReviews: {} });
  });

  it("round-trips custom places and reviews", () => {
    const store = {
      customPlaces: [{ id: "place-1", name: "Test Cafe" }],
      userReviews: { "place-1": [{ id: "r1", rating: 4 }] },
    };
    saveStore(store);
    expect(loadStore()).toEqual(store);
  });

  it("recovers from corrupt JSON", () => {
    localStorage.setItem("pittsburgh-map-store-v1", "{not-json");
    expect(loadStore()).toEqual({ customPlaces: [], userReviews: {} });
  });

  it("ignores malformed saved arrays", () => {
    localStorage.setItem("pittsburgh-map-store-v1", JSON.stringify({ customPlaces: "nope", userReviews: 3 }));
    expect(loadStore()).toEqual({ customPlaces: [], userReviews: {} });
  });
});

describe("createId", () => {
  it("prefixes generated ids", () => {
    expect(createId("review")).toMatch(/^review-/);
  });
});
