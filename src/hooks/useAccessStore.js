import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";

export function useAccessStore() {
  const [places, setPlaces] = useState([]);
  const [ratings, setRatings] = useState({});
  const [reviewsByPlace, setReviewsByPlace] = useState({});
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const refreshPlaces = useCallback(async () => {
    const data = await api.getPlaces();
    setPlaces(data.places);
    setRatings(data.ratings);
    setStatus("ready");
    setError("");
    return data;
  }, []);

  useEffect(() => {
    refreshPlaces().catch(() => {
      setStatus("error");
      setError("Could not load saved places and notes.");
    });
  }, [refreshPlaces]);

  const loadReviews = useCallback(async (placeId) => {
    const data = await api.getReviews(placeId);
    setReviewsByPlace((current) => ({ ...current, [placeId]: data.reviews }));
    return data.reviews;
  }, []);

  const addPlace = useCallback(
    async (draft) => {
      const data = await api.createPlace(draft);
      await refreshPlaces();
      return data.place;
    },
    [refreshPlaces],
  );

  const addReview = useCallback(
    async (placeId, draft) => {
      await api.createReview(placeId, draft);
      await Promise.all([loadReviews(placeId), refreshPlaces()]);
    },
    [loadReviews, refreshPlaces],
  );

  const removeReview = useCallback(
    async (placeId, reviewId) => {
      await api.deleteReview(reviewId);
      await Promise.all([loadReviews(placeId), refreshPlaces()]);
    },
    [loadReviews, refreshPlaces],
  );

  return {
    places,
    ratings,
    reviewsByPlace,
    status,
    error,
    refreshPlaces,
    loadReviews,
    addPlace,
    addReview,
    removeReview,
  };
}
