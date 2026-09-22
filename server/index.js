import { createHash, randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db, mapPlace, mapReview, publicUser, ratingsMap } from "./db.js";
import {
  asString,
  validateDisplayName,
  validatePassword,
  validatePlaceInput,
  validateRating,
  validateReviewText,
  validateUsername,
} from "./validate.js";

const PORT = Number(process.env.PORT) || 5174;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE = "pgh_session";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const findUserByName = db.prepare("SELECT * FROM users WHERE username = ?");
const findUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const insertUser = db.prepare(
  "INSERT INTO users (id, username, display_name, password_hash, guest, created_at) VALUES (?, ?, ?, ?, ?, ?)",
);
const insertSession = db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)");
const findSession = db.prepare(
  `SELECT sessions.id AS session_id, sessions.expires_at, users.*
   FROM sessions JOIN users ON users.id = sessions.user_id
   WHERE sessions.id = ?`,
);
const deleteSession = db.prepare("DELETE FROM sessions WHERE id = ?");
const deleteExpired = db.prepare("DELETE FROM sessions WHERE expires_at < ?");
const listPlaces = db.prepare("SELECT * FROM places ORDER BY custom ASC, name ASC");
const findPlace = db.prepare("SELECT * FROM places WHERE id = ?");
const insertPlace = db.prepare(`
  INSERT INTO places (
    id, name, category, description, lat, lng, walking, wheelchair, ramps, elevators, restroom, notes, paths, custom, created_by, created_at
  ) VALUES (
    @id, @name, @category, @description, @lat, @lng, @walking, @wheelchair, @ramps, @elevators, @restroom, @notes, @paths, 1, @created_by, @created_at
  )
`);
const listReviews = db.prepare("SELECT * FROM reviews WHERE place_id = ? ORDER BY created_at DESC");
const insertReview = db.prepare(`
  INSERT INTO reviews (id, place_id, user_id, author, rating, walking, wheelchair, text, created_at, seeded)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
`);
const findReview = db.prepare("SELECT * FROM reviews WHERE id = ?");
const removeReview = db.prepare("DELETE FROM reviews WHERE id = ? AND user_id = ? AND seeded = 0");

const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  deleteExpired.run(Date.now());
  next();
});
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: "Request blocked." });
  }
  return next();
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Wait a few minutes." },
});

function createId(prefix) {
  return `${prefix}-${randomBytes(16).toString("hex")}`;
}

function hashSession(token) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieValue(req, name) {
  const header = req.headers.cookie;
  if (!header) return "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function currentUser(req) {
  const token = cookieValue(req, COOKIE);
  if (!token) return null;
  const row = findSession.get(hashSession(token));
  if (!row || row.expires_at < Date.now()) return null;
  return publicUser(row);
}

function requireUser(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Log in to continue." });
  req.user = user;
  return next();
}

app.get("/api/auth/me", (req, res) => {
  res.json({ user: currentUser(req) });
});

app.post("/api/auth/signup", authLimit, (req, res) => {
  const usernameError = validateUsername(req.body?.username);
  const passwordError = validatePassword(req.body?.password);
  const nameError = validateDisplayName(req.body?.displayName ?? req.body?.username);
  if (usernameError || passwordError || nameError) {
    return res.status(400).json({ error: usernameError || passwordError || nameError });
  }

  const username = asString(req.body.username, 24);
  if (findUserByName.get(username)) {
    return res.status(409).json({ error: "That username is taken." });
  }

  const id = createId("user");
  insertUser.run(
    id,
    username,
    asString(req.body.displayName ?? username, 40),
    bcrypt.hashSync(req.body.password, 12),
    0,
    Date.now(),
  );

  const token = randomBytes(32).toString("hex");
  insertSession.run(hashSession(token), id, Date.now() + SESSION_MS);
  setSessionCookie(res, token);
  return res.status(201).json({ user: publicUser(findUserById.get(id)) });
});

app.post("/api/auth/login", authLimit, (req, res) => {
  const username = asString(req.body?.username, 24);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = findUserByName.get(username);
  const dummy = "$2a$12$v.Xz0n3z0n3z0n3z0n3z0eO9o9o9o9o9o9o9o9o9o9o9o9o9o9o9e";
  let ok = false;
  try {
    ok = bcrypt.compareSync(password, user?.password_hash || dummy);
  } catch {
    ok = false;
  }
  if (!user || user.guest || !ok) {
    return res.status(401).json({ error: "Username or password is wrong." });
  }

  const token = randomBytes(32).toString("hex");
  insertSession.run(hashSession(token), user.id, Date.now() + SESSION_MS);
  setSessionCookie(res, token);
  return res.json({ user: publicUser(user) });
});

app.post("/api/auth/guest", authLimit, (req, res) => {
  const id = createId("user");
  const username = `guest_${randomBytes(5).toString("hex")}`;
  insertUser.run(id, username, "Guest", `guest:${randomBytes(32).toString("hex")}`, 1, Date.now());

  const token = randomBytes(32).toString("hex");
  insertSession.run(hashSession(token), id, Date.now() + SESSION_MS);
  setSessionCookie(res, token);
  return res.status(201).json({ user: publicUser(findUserById.get(id)) });
});

app.post("/api/auth/logout", (req, res) => {
  const token = cookieValue(req, COOKIE);
  if (token) deleteSession.run(hashSession(token));
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/places", (_req, res) => {
  res.json({
    places: listPlaces.all().map(mapPlace),
    ratings: ratingsMap(),
  });
});

app.post("/api/places", requireUser, (req, res) => {
  const parsed = validatePlaceInput(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const id = createId("place");
  const now = Date.now();
  insertPlace.run({
    id,
    name: parsed.value.name,
    category: parsed.value.category,
    description: parsed.value.description,
    lat: parsed.value.lat,
    lng: parsed.value.lng,
    walking: parsed.value.accessibility.walking,
    wheelchair: parsed.value.accessibility.wheelchair,
    ramps: parsed.value.accessibility.ramps,
    elevators: parsed.value.accessibility.elevators,
    restroom: parsed.value.accessibility.restroom,
    notes: parsed.value.accessibility.notes,
    paths: JSON.stringify(parsed.value.paths),
    created_by: req.user.id,
    created_at: now,
  });
  return res.status(201).json({ place: mapPlace(findPlace.get(id)) });
});

app.get("/api/places/:id/reviews", (req, res) => {
  if (!findPlace.get(req.params.id)) return res.status(404).json({ error: "Place not found." });
  res.json({ reviews: listReviews.all(req.params.id).map(mapReview) });
});

app.post("/api/places/:id/reviews", requireUser, (req, res) => {
  if (!findPlace.get(req.params.id)) return res.status(404).json({ error: "Place not found." });
  const ratingError = validateRating(req.body?.rating);
  const walkError = validateRating(req.body?.walking);
  const chairError = validateRating(req.body?.wheelchair);
  const textError = validateReviewText(req.body?.text);
  if (ratingError || walkError || chairError || textError) {
    return res.status(400).json({ error: ratingError || walkError || chairError || textError });
  }

  const id = createId("review");
  insertReview.run(
    id,
    req.params.id,
    req.user.id,
    req.user.displayName,
    Number(req.body.rating),
    Number(req.body.walking),
    Number(req.body.wheelchair),
    asString(req.body.text, 2000),
    Date.now(),
  );
  return res.status(201).json({ review: mapReview(findReview.get(id)) });
});

app.delete("/api/reviews/:id", requireUser, (req, res) => {
  const review = findReview.get(req.params.id);
  if (!review) return res.status(404).json({ error: "Note not found." });
  const result = removeReview.run(req.params.id, req.user.id);
  if (!result.changes) return res.status(403).json({ error: "You can only remove your own notes." });
  return res.json({ ok: true });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
if (process.env.SERVE_STATIC === "1") {
  app.use(express.static(publicDir));
}

app.listen(PORT, () => {
  console.log(`Access API on http://localhost:${PORT}`);
});
