import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../server/db.js";
import { validatePassword, validateUsername } from "../server/validate.js";

const username = process.env.ADMIN_USERNAME?.trim();
const password = process.env.ADMIN_PASSWORD;
const error = validateUsername(username) || validatePassword(password);
if (error) {
  console.error(`Set ADMIN_USERNAME and ADMIN_PASSWORD. ${error}`);
  process.exitCode = 1;
} else if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) {
  console.error("That username already exists. Choose a new admin username.");
  process.exitCode = 1;
} else {
  db.prepare(`INSERT INTO users (id, username, display_name, password_hash, guest, admin, created_at)
    VALUES (?, ?, ?, ?, 0, 1, ?)`).run(randomUUID(), username, username, bcrypt.hashSync(password, 12), Date.now());
  console.log("Admin account created. Use Admin login in the app.");
}
db.close();
