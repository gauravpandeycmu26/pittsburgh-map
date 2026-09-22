import { PATH_TYPE_IDS, walkingLabels, wheelchairLabels, yesNoLabels } from "../src/data/accessibility.js";
import { categories, PITTSBURGH_BOUNDS } from "../src/data/places.js";

const USERNAME = /^[a-zA-Z0-9_]{3,24}$/;
const CATEGORY_IDS = new Set(categories.map((category) => category.id));
const WALKING = new Set(Object.keys(walkingLabels));
const WHEELCHAIR = new Set(Object.keys(wheelchairLabels));
const YES_NO = new Set(Object.keys(yesNoLabels));
const PATHS = new Set(PATH_TYPE_IDS);

export function asString(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

export function validateUsername(value) {
  const username = asString(value, 24);
  if (!USERNAME.test(username)) return "Use 3–24 letters, numbers, or underscores.";
  return null;
}

export function validatePassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 72) {
    return "Password must be 8–72 characters.";
  }
  return null;
}

export function validateDisplayName(value) {
  const name = asString(value, 40);
  if (name.length < 2) return "Add a display name.";
  return null;
}

export function validateRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "Rating must be 1 to 5.";
  return null;
}

export function validateReviewText(value) {
  const text = asString(value, 2000);
  if (text.length < 8) return "Describe ramps, hills, doors, or other barriers.";
  return null;
}

export function validatePlaceInput(body) {
  const name = asString(body?.name, 80);
  const category = asString(body?.category, 40);
  const description = asString(body?.description, 500);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const access = body?.accessibility ?? {};
  const walking = asString(access.walking, 20);
  const wheelchair = asString(access.wheelchair, 20);
  const ramps = asString(access.ramps, 20);
  const elevators = asString(access.elevators, 20);
  const restroom = asString(access.restroom, 20);
  const notes = asString(access.notes, 1000);
  const paths = Array.isArray(body?.paths) ? body.paths.filter((id) => PATHS.has(id)).slice(0, 8) : [];

  if (!name) return { error: "Add a name for this landmark." };
  if (!CATEGORY_IDS.has(category)) return { error: "Pick a valid category." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { error: "Drop a pin on the map." };
  if (lat < PITTSBURGH_BOUNDS[0][0] || lat > PITTSBURGH_BOUNDS[1][0]) return { error: "Keep the pin inside Pittsburgh." };
  if (lng < PITTSBURGH_BOUNDS[0][1] || lng > PITTSBURGH_BOUNDS[1][1]) return { error: "Keep the pin inside Pittsburgh." };
  if (!WALKING.has(walking) || !WHEELCHAIR.has(wheelchair)) return { error: "Choose walking and wheelchair access." };
  if (!YES_NO.has(ramps) || !YES_NO.has(elevators) || !YES_NO.has(restroom)) {
    return { error: "Choose ramp, elevator, and restroom access." };
  }

  return {
    value: {
      name,
      category,
      description,
      lat,
      lng,
      accessibility: { walking, wheelchair, ramps, elevators, restroom, notes },
      paths,
    },
  };
}
