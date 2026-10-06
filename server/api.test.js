import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";

// Exercise real HTTP authorization and persistence against an isolated database.
test("demo locations, existing review threads, missing places, and admin permissions", async () => {
  const directory = mkdtempSync(join(tmpdir(), "access-api-"));
  const env = { ...process.env, DATABASE_PATH: join(directory, "test.sqlite"), ADMIN_USERNAME: "test_admin", ADMIN_PASSWORD: "test-password-only" };
  function script(path) {
    const result = spawnSync(process.execPath, [path], { env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  let server;
  try {
    script("scripts/create-admin.js");
    script("scripts/seed-mocks.js");
    script("scripts/seed-mocks.js");
    const socket = createServer();
    socket.listen(0, "127.0.0.1");
    await once(socket, "listening");
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    server = spawn(process.execPath, ["server/index.js"], { env: { ...env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("API startup timed out")), 10000);
      server.stdout.once("data", () => { clearTimeout(timer); resolve(); });
      server.once("exit", (code) => { clearTimeout(timer); reject(new Error(`API exited: ${code}`)); });
    });
    async function request(path, { method = "GET", body, cookie } = {}) {
      const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
    }
    const initial = await request("/places");
    assert.equal(initial.data.places.filter((place) => place.id.startsWith("mock-")).length, 3);
    const cmu = initial.data.places.find((item) => item.id === "cmu");
    assert.ok(cmu.aliases.includes("CMU"));
    assert.equal(initial.data.ratings["mock-cafe"].count, 1);
    const signup = await request("/auth/signup", { method: "POST", body: { username: "regular", password: "regular-password", admin: true } });
    assert.equal(signup.status, 201);
    assert.equal(signup.data.user.admin, false);
    const cookie = signup.cookie;
    assert.equal((await request("/auth/admin/login", { method: "POST", body: { username: "regular", password: "regular-password" } })).status, 401);
    assert.equal((await request("/auth/admin/login", { method: "POST", body: { username: "test_admin", password: "wrong" } })).status, 401);
    const place = initial.data.places.find((item) => item.id === "mock-cafe");
    const reused = await request("/places", { method: "POST", cookie, body: place });
    assert.equal(reused.status, 200);
    assert.equal(reused.data.place.id, place.id);
    assert.equal(reused.data.existing, true);
    const draft = { rating: 5, walking: 5, wheelchair: 4, text: "New review preserves the original review." };
    const first = await request(`/places/${place.id}/reviews`, { method: "POST", cookie, body: draft });
    assert.equal(first.status, 201);
    assert.equal((await request(`/places/${place.id}/reviews`, { method: "POST", cookie, body: draft })).status, 201);
    assert.equal((await request(`/places/${place.id}/reviews`)).data.reviews.length, 3);
    assert.equal((await request("/places/missing")).status, 404);
    assert.equal((await request("/places/missing/reviews")).status, 404);
    assert.equal((await request("/places/missing/reviews", { method: "POST", cookie, body: draft })).status, 404);
    const guest = await request("/auth/guest", { method: "POST", body: {} });
    assert.equal(guest.data.user.admin, false);
    assert.equal((await request(`/reviews/${first.data.review.id}`, { method: "DELETE", cookie: guest.cookie })).status, 403);
    const admin = await request("/auth/admin/login", { method: "POST", body: { username: "test_admin", password: env.ADMIN_PASSWORD } });
    assert.equal(admin.status, 200);
    assert.equal(admin.data.user.admin, true);
    assert.equal((await request("/auth/me", { cookie: admin.cookie })).data.user.admin, true);
    assert.equal((await request(`/reviews/${first.data.review.id}`, { method: "DELETE", cookie: admin.cookie })).status, 200);
    assert.equal((await request(`/places/${place.id}/reviews`)).data.reviews.length, 2);

    const note = "Steep curb at the side door.";
    const guestReview = await request("/places/mock-park/reviews", {
      method: "POST",
      cookie: guest.cookie,
      body: { rating: 4, walking: 4, wheelchair: 3, text: note },
    });
    assert.equal(guestReview.status, 201);
    const placeCount = (await request("/places")).data.places.length;
    const signupStarted = Date.now();
    const upgraded = await request("/auth/signup", {
      method: "POST",
      cookie: guest.cookie,
      body: { username: "kept_notes", password: "kept-password", displayName: "Kept Notes" },
    });
    assert.ok(Date.now() - signupStarted < 5000);
    assert.equal(upgraded.status, 201);
    assert.equal(upgraded.data.user.id, guest.data.user.id);
    assert.equal(upgraded.data.user.guest, false);
    const kept = await request("/places/mock-park/reviews");
    assert.equal(
      kept.data.reviews.some((review) => review.text === note && review.author === "Kept Notes" && review.userId === guest.data.user.id),
      true,
    );
    assert.equal((await request("/places")).data.places.length, placeCount);
    assert.equal((await request(`/places/${place.id}/reviews`)).data.reviews.length, 2);
    const loginStarted = Date.now();
    const relogin = await request("/auth/login", {
      method: "POST",
      body: { username: "kept_notes", password: "kept-password" },
    });
    assert.equal(relogin.status, 200);
    assert.equal(relogin.data.user.displayName, "Kept Notes");
    assert.ok(Date.now() - loginStarted < 5000);
    assert.equal((await request("/places")).data.places.length, placeCount);
  } finally {
    if (server && server.exitCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
