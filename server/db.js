import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { pathsFor, placeAccessibility, UNKNOWN_ACCESS } from "../src/data/accessibility.js";
import { places as catalogPlaces } from "../src/data/places.js";
import { seedReviews } from "../src/data/seedReviews.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const dbPath = join(dataDir, "app.sqlite");

mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(dbPath);

const userColumns = db.prepare("PRAGMA table_info(users)").all();
if (userColumns.length && !userColumns.some((column) => column.name === "guest")) {
  db.exec("ALTER TABLE users ADD COLUMN guest INTEGER NOT NULL DEFAULT 0");
}

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    guest INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    walking TEXT NOT NULL,
    wheelchair TEXT NOT NULL,
    ramps TEXT NOT NULL,
    elevators TEXT NOT NULL,
    restroom TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    paths TEXT NOT NULL DEFAULT '[]',
    custom INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    user_id TEXT,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    walking INTEGER,
    wheelchair INTEGER,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    seeded INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
  );
`);

const upsertPlace = db.prepare(`
  INSERT INTO places (
    id, name, category, description, lat, lng, walking, wheelchair, ramps, elevators, restroom, notes, paths, custom, created_by, created_at
  ) VALUES (
    @id, @name, @category, @description, @lat, @lng, @walking, @wheelchair, @ramps, @elevators, @restroom, @notes, @paths, @custom, @created_by, @created_at
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    lat = excluded.lat,
    lng = excluded.lng,
    walking = excluded.walking,
    wheelchair = excluded.wheelchair,
    ramps = excluded.ramps,
    elevators = excluded.elevators,
    restroom = excluded.restroom,
    notes = excluded.notes,
    paths = excluded.paths
  WHERE places.custom = 0
`);

const insertReview = db.prepare(`
  INSERT OR IGNORE INTO reviews (id, place_id, user_id, author, rating, walking, wheelchair, text, created_at, seeded)
  VALUES (@id, @place_id, NULL, @author, @rating, @walking, @wheelchair, @text, @created_at, 1)
`);

for (const place of catalogPlaces) {
  const access = { ...UNKNOWN_ACCESS, ...placeAccessibility[place.id] };
  upsertPlace.run({
    id: place.id,
    name: place.name,
    category: place.category,
    description: place.description ?? "",
    lat: place.lat,
    lng: place.lng,
    walking: access.walking,
    wheelchair: access.wheelchair,
    ramps: access.ramps,
    elevators: access.elevators,
    restroom: access.restroom,
    notes: access.notes ?? "",
    paths: JSON.stringify(pathsFor(place)),
    custom: 0,
    created_by: null,
    created_at: 0,
  });
}

for (const [placeId, reviews] of Object.entries(seedReviews)) {
  for (const review of reviews) {
    insertReview.run({
      id: review.id,
      place_id: placeId,
      author: review.author,
      rating: review.rating,
      walking: review.walking ?? null,
      wheelchair: review.wheelchair ?? null,
      text: review.text,
      created_at: review.createdAt,
    });
  }
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    guest: Boolean(row.guest),
  };
}

export function mapPlace(row) {
  let paths = [];
  try {
    paths = JSON.parse(row.paths || "[]");
  } catch {
    paths = [];
  }
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    custom: Boolean(row.custom),
    paths,
    accessibility: {
      walking: row.walking,
      wheelchair: row.wheelchair,
      ramps: row.ramps,
      elevators: row.elevators,
      restroom: row.restroom,
      notes: row.notes,
    },
  };
}

export function mapReview(row) {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    author: row.author,
    rating: row.rating,
    walking: row.walking,
    wheelchair: row.wheelchair,
    text: row.text,
    createdAt: row.created_at,
    seeded: Boolean(row.seeded),
  };
}

export function ratingsMap() {
  const rows = db
    .prepare(
      `SELECT place_id, COUNT(*) AS count, AVG(rating) AS average
       FROM reviews GROUP BY place_id`,
    )
    .all();
  const ratings = {};
  for (const row of rows) {
    ratings[row.place_id] = { count: row.count, average: row.average };
  }
  return ratings;
}
