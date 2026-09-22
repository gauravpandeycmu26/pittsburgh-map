async function request(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  me: () => request("/api/auth/me"),
  signup: (body) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  guest: () => request("/api/auth/guest", { method: "POST", body: "{}" }),
  logout: () => request("/api/auth/logout", { method: "POST", body: "{}" }),
  getPlaces: () => request("/api/places"),
  createPlace: (body) => request("/api/places", { method: "POST", body: JSON.stringify(body) }),
  getReviews: (placeId) => request(`/api/places/${encodeURIComponent(placeId)}/reviews`),
  createReview: (placeId, body) =>
    request(`/api/places/${encodeURIComponent(placeId)}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteReview: (reviewId) => request(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: "DELETE" }),
};
