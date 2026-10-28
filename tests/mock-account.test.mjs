import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import path from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

let app;
let origin;
let output = "";

before(async () => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/SUPABASE|^SITE_URL$/.test(key)) delete env[key];
  }
  app = spawn(process.execPath, [
    path.join("node_modules", "next", "dist", "bin", "next"),
    "start", "--hostname", "127.0.0.1", "--port", String(port),
  ], { env, stdio: ["ignore", "pipe", "pipe"] });
  app.stdout.on("data", (chunk) => { output += chunk; });
  app.stderr.on("data", (chunk) => { output += chunk; });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch (error) {
      if (error.cause?.code !== "ECONNREFUSED") throw error;
    }
    await delay(100);
  }
  throw new Error(`Test server did not become ready:\n${output}`);
});

after(async () => {
  if (app && app.exitCode === null) {
    const exited = once(app, "exit");
    app.kill();
    await exited;
  }
});

function navigation(html) {
  const nav = html.match(/<nav\b[^>]*aria-label="Main navigation"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, "Missing shared navigation");
  return nav[1];
}

test("home and account pages immediately display the same demo identity without a session", async () => {
  for (const route of ["/", "/account"]) {
    for (const cookie of ["", "sb-legacy-auth-token=invalid"]) {
      const response = await fetch(`${origin}${route}`, {
        headers: { Cookie: cookie },
        redirect: "manual",
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
      assert.deepEqual(response.headers.getSetCookie(), []);
      const html = await response.text();
      assert.match(html, /Demo User/);
      assert.match(navigation(html), /Open account menu/);
      assert.doesNotMatch(html, /Loading account|Sign in|Sign up|Sign out|\/api\/auth/);
      if (route === "/") assert.match(html, /href="\/account"/);
      else {
        assert.match(html, /demo@example\.com/);
        assert.match(html, /No real authentication is active/);
      }
    }
  }
});

test("registration and authentication routes no longer exist", async () => {
  for (const route of ["/login", "/register", "/auth/callback?code=unused", "/api/auth/account"]) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    assert.equal(response.status, 404, route);
    assert.equal(response.headers.get("location"), null);
    assert.deepEqual(response.headers.getSetCookie(), []);
    assert.match(navigation(await response.text()), /Open account menu/);
  }
});

test("health route remains available", async () => {
  const response = await fetch(`${origin}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "careerkit" });
});
