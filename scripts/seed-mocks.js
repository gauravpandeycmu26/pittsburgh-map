import { db } from "../server/db.js";

const places = [
  ["mock-cafe", "Demo: Riverside Cafe", "Landmarks", 40.445, -80.003],
  ["mock-park", "Demo: Neighborhood Park", "Parks", 40.456, -79.974],
  ["mock-library", "Demo: Community Library", "Landmarks", 40.438, -79.976],
];
const insert = db.prepare(`INSERT OR IGNORE INTO places
  (id, name, category, description, lat, lng, walking, wheelchair, ramps, elevators, restroom, notes, paths, custom, created_at)
  VALUES (?, ?, ?, 'Fictional demo location for testing. Not a real destination.', ?, ?,
    'unknown', 'unknown', 'unknown', 'unknown', 'unknown', '', '[]', 1, ?)`);
const review = db.prepare(`INSERT OR IGNORE INTO reviews
  (id, place_id, author, rating, walking, wheelchair, text, created_at, seeded)
  VALUES (?, ?, 'Demo reviewer', 4, 4, 4, 'Sample review for testing only. Accessibility has not been verified.', ?, 1)`);
db.exec("BEGIN");
try {
  for (const [id, name, category, lat, lng] of places) {
    insert.run(id, name, category, lat, lng, Date.now());
  }
  review.run("mock-cafe-review", "mock-cafe", Date.now());
  db.exec("COMMIT");
  console.log("Added 3 labeled demo locations, including one with an existing review.");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}
