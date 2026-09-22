import { PHOTON_BBOX, PITTSBURGH_CENTER } from "../data/places.js";
import { findExistingPlace } from "./geo.js";

export const PHOTON_URL = "https://photon.komoot.io/api/";
export const REMOTE_SEARCH_MIN_LENGTH = 3;
export const REMOTE_SEARCH_DEBOUNCE_MS = 400;

export function filterPlaces(places, query, activeCategories) {
  const needle = query.trim().toLowerCase();
  return places.filter((place) => {
    if (activeCategories && !activeCategories.has(place.category)) return false;
    if (!needle) return true;
    const haystack = [place.name, place.category, place.description, ...(place.aliases ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function createPhotonSearchUrl(query) {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("lat", String(PITTSBURGH_CENTER[0]));
  url.searchParams.set("lon", String(PITTSBURGH_CENTER[1]));
  url.searchParams.set("limit", "5");
  url.searchParams.set("bbox", PHOTON_BBOX);
  return url;
}

export function parsePhotonHits(data) {
  return (data?.features ?? []).map((feature) => {
    const [lng, lat] = feature.geometry?.coordinates ?? [];
    const props = feature.properties ?? {};
    return {
      name: props.name || props.street || "Result",
      detail: [props.city, props.state, props.osm_value].filter(Boolean).join(" · "),
      lat,
      lng,
    };
  });
}

export function resolveSearchHit(hit, placeList) {
  const existing = findExistingPlace(hit, placeList);
  if (existing) {
    return { kind: "place", place: existing };
  }
  return {
    kind: "prospect",
    place: {
      name: hit.name,
      category: "Landmarks",
      description: hit.detail,
      lat: hit.lat,
      lng: hit.lng,
    },
  };
}
