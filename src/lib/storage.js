import { seedReviews } from "../data/seedReviews.js";

const STORAGE_KEY = "pittsburgh-map-store-v1";

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { customPlaces: [], userReviews: {} };
    const parsed = JSON.parse(raw);
    return {
      customPlaces: Array.isArray(parsed.customPlaces) ? parsed.customPlaces : [],
      userReviews: parsed.userReviews && typeof parsed.userReviews === "object" ? parsed.userReviews : {},
    };
  } catch {
    return { customPlaces: [], userReviews: {} };
  }
}

export function saveStore(store) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      customPlaces: store.customPlaces,
      userReviews: store.userReviews,
    }),
  );
}

export function reviewsFor(placeId, userReviews) {
  const seeded = seedReviews[placeId] ?? [];
  const written = userReviews[placeId] ?? [];
  return [...seeded, ...written].sort((a, b) => b.createdAt - a.createdAt);
}

export function averageRating(reviewList) {
  if (reviewList.length === 0) return 0;
  const total = reviewList.reduce((sum, review) => sum + review.rating, 0);
  return total / reviewList.length;
}

export function createId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
