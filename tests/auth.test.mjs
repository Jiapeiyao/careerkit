import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import path from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const user = {
  id: "12345678-1234-1234-1234-123456789abc",
  email: "auth-test@example.com",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const jwt = (exp) => [
  { alg: "HS256", typ: "JWT" },
  { sub: user.id, exp, aud: "authenticated", role: "authenticated" },
].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
  .concat("test-signature").join(".");
const session = (expired = false) => ({
  access_token: jwt(Math.floor(Date.now() / 1000) + (expired ? -120 : 3600)),
  token_type: "bearer",
  refresh_token: "test-refresh-token",
  expires_in: expired ? -120 : 3600,
  expires_at: Math.floor(Date.now() / 1000) + (expired ? -120 : 3600),
  user,
});

let app;
let origin;
let supabaseOrigin;
let output = "";
let refreshes = 0;
let rejectSignOut = false;
const mock = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url.startsWith("/auth/v1/token")) {
    let body = "";
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    if (payload.refresh_token === "test-refresh-token") {
      refreshes++;
      response.end(JSON.stringify(session()));
    } else if (payload.auth_code === "valid-code" && payload.code_verifier) {
      response.end(JSON.stringify(session()));
    } else {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "bad_code_verifier", msg: "Invalid code" }));
    }
  } else if (request.url === "/auth/v1/user") {
    if (request.headers.authorization === `Bearer ${session().access_token}`) {
      response.end(JSON.stringify(user));
    } else {
      // Accept any unexpired test token. Real signature verification belongs to Supabase.
      const token = request.headers.authorization?.slice(7);
      const claims = token && JSON.parse(Buffer.from(token.split(".")[1], "base64url"));
      if (claims?.sub === user.id && claims.exp > Date.now() / 1000) {
        response.end(JSON.stringify(user));
      } else {
        response.statusCode = 401;
        response.end(JSON.stringify({ code: "bad_jwt", msg: "Invalid token" }));
      }
    }
  } else if (request.url.startsWith("/auth/v1/logout")) {
    response.statusCode = rejectSignOut ? 400 : 204;
    response.end(rejectSignOut ? JSON.stringify({ code: "test_failure", msg: "Sign-out failed" }) : undefined);
  } else {
    response.statusCode = 404;
    response.end(JSON.stringify({ msg: "Unknown mock endpoint" }));
  }
});

function cookieHeader(response) {
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

function actionFor(html, label) {
  const form = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)]
    .find((match) => match[1].includes(label));
  assert.ok(form, `Missing form: ${label}`);
  const action = form[1].match(/name="(\$ACTION_ID_[^"]+)"/);
  assert.ok(action, `Missing server action: ${label}`);
  return action[1];
}

async function submit(route, action, cookie = "") {
  const data = new FormData();
  data.set(action, "");
  return fetch(`${origin}${route}`, {
    method: "POST",
    headers: { Origin: origin, Cookie: cookie },
    body: data,
    redirect: "manual",
  });
}

async function signIn() {
  const login = await fetch(`${origin}/login`);
  const response = await submit("/login", actionFor(await login.text(), "Continue with Google"));
  const callback = await fetch(`${origin}/auth/callback?code=valid-code`, {
    headers: { Cookie: cookieHeader(response) },
    redirect: "manual",
  });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get("location"), `${origin}/account`);
  return cookieHeader(callback);
}

before(async () => {
  mock.listen(0, "127.0.0.1");
  await once(mock, "listening");
  supabaseOrigin = `http://127.0.0.1:${mock.address().port}`;
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, [
    path.join("node_modules", "next", "dist", "bin", "next"),
    "start", "--hostname", "127.0.0.1", "--port", String(port),
  ], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: supabaseOrigin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      SITE_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
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
  await new Promise((resolve) => mock.close(resolve));
});

test("public home page and health route remain available", async () => {
  assert.match(await (await fetch(origin)).text(), /CareerKit/);
  assert.deepEqual(await (await fetch(`${origin}/api/health`)).json(), {
    status: "ok", service: "careerkit",
  });
});

test("anonymous users cannot access the account page", async () => {
  const response = await fetch(`${origin}/account`, { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), origin).href, `${origin}/login`);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

for (const provider of ["Google", "GitHub"]) {
  test(`${provider} sign-in starts PKCE and uses the configured callback`, async () => {
    const html = await (await fetch(`${origin}/login`)).text();
    const response = await submit("/login", actionFor(html, `Continue with ${provider}`));
    assert.equal(response.status, 303);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.origin, supabaseOrigin);
    assert.equal(location.searchParams.get("provider"), provider.toLowerCase());
    assert.equal(location.searchParams.get("redirect_to"), `${origin}/auth/callback`);
    assert.equal(location.searchParams.get("code_challenge_method"), "s256");
    assert.ok(location.searchParams.get("code_challenge"));
    assert.match(cookieHeader(response), /code-verifier/);
    assert.match(response.headers.getSetCookie().join(";"), /httponly/i);
  });
}

test("failed and cancelled callbacks show an error without an external redirect", async () => {
  for (const query of ["", "?error=access_denied", "?code=invalid-code", "?code=valid-code", "?next=https://evil.example"]) {
    const response = await fetch(`${origin}/auth/callback${query}`, { redirect: "manual" });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), `${origin}/login?error=callback`);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const login = await fetch(`${origin}/login?error=callback`);
  assert.match(await login.text(), /Sign-in did not complete/);
});

test("successful callback creates a verified session that survives reload", async () => {
  const cookie = await signIn();
  for (let reload = 0; reload < 2; reload++) {
    const response = await fetch(`${origin}/account`, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /auth-test@example.com/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const response = await fetch(`${origin}/login`, { headers: { Cookie: cookie }, redirect: "manual" });
  assert.equal(new URL(response.headers.get("location"), origin).href, `${origin}/account`);
});

test("expired sessions refresh and propagate replacement cookies", async () => {
  const value = `base64-${Buffer.from(JSON.stringify(session(true))).toString("base64url")}`;
  const before = refreshes;
  const response = await fetch(`${origin}/account`, {
    headers: { Cookie: `sb-127-auth-token=${value}` },
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /auth-test@example.com/);
  assert.equal(refreshes, before + 1);
  assert.match(cookieHeader(response), /auth-token=/);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("an unverified cookie cannot grant account access", async () => {
  const forged = session();
  const parts = forged.access_token.split(".");
  parts[1] = Buffer.from(JSON.stringify({
    sub: "unverified-user",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  forged.access_token = parts.join(".");
  const value = `base64-${Buffer.from(JSON.stringify(forged)).toString("base64url")}`;
  const response = await fetch(`${origin}/account`, {
    headers: { Cookie: `sb-127-auth-token=${value}` }, redirect: "manual",
  });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), origin).href, `${origin}/login`);
  assert.doesNotMatch(await response.text(), /auth-test@example.com/);
  assert.match(response.headers.getSetCookie().join(";"), /Max-Age=0/i);
});

test("sign-out errors are visible and successful sign-out clears the session", async () => {
  const cookie = await signIn();
  const html = await (await fetch(`${origin}/account`, { headers: { Cookie: cookie } })).text();
  const action = actionFor(html, "Sign out");
  rejectSignOut = true;
  try {
    const failed = await submit("/account", action, cookie);
    assert.equal(failed.headers.get("location"), "/account?error=signout");
    const error = await fetch(`${origin}/account?error=signout`, { headers: { Cookie: cookie } });
    assert.match(await error.text(), /Sign-out failed/);
  } finally {
    rejectSignOut = false;
  }
  const response = await submit("/account", action, cookie);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/login");
  assert.match(response.headers.getSetCookie().join(";"), /Max-Age=0/i);
  const account = await fetch(`${origin}/account`, {
    headers: { Cookie: cookieHeader(response) }, redirect: "manual",
  });
  assert.equal(new URL(account.headers.get("location"), origin).href, `${origin}/login`);
});
