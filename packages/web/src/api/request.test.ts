// Run: node --experimental-strip-types --test packages/web/src/api/request.test.ts
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

// Minimal browser surface: request.ts only refreshes in a browser.
const events: string[] = [];
(globalThis as Record<string, unknown>).window = {
  location: { origin: "http://localhost:4000" },
  dispatchEvent: (e: Event) => events.push(e.type),
};
if (typeof (globalThis as Record<string, unknown>).CustomEvent === "undefined") {
  (globalThis as Record<string, unknown>).CustomEvent = class extends Event {};
}

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;
let handler: Handler;
const calls: string[] = [];
globalThis.fetch = (async (url: string, init: RequestInit) => {
  calls.push(`${init.method ?? "GET"} ${new URL(url).pathname}`);
  return handler(url, init);
}) as typeof fetch;

const { request, ApiError, SESSION_EXPIRED_EVENT, clearInflightRequests } = await import("./request");

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  calls.length = 0;
  events.length = 0;
  clearInflightRequests();
});

test("401 refreshes once, then retries the request", async () => {
  let authed = false;
  handler = (url) => {
    const path = new URL(url).pathname;
    if (path === "/auth/refresh") {
      authed = true;
      return json(200, { user: {} });
    }
    return authed ? json(200, { ok: 1 }) : json(401, { message: "Invalid access cookie" });
  };
  assert.deepEqual(await request("/weddings/mine"), { ok: 1 });
  assert.deepEqual(calls, ["GET /weddings/mine", "POST /auth/refresh", "GET /weddings/mine"]);
});

test("concurrent 401s share a single refresh", async () => {
  let authed = false;
  handler = async (url) => {
    const path = new URL(url).pathname;
    if (path === "/auth/refresh") {
      await new Promise((r) => setTimeout(r, 10));
      authed = true;
      return json(200, {});
    }
    return authed ? json(200, { path }) : json(401, {});
  };
  await Promise.all([request("/a"), request("/b", { method: "POST", body: "{}" }), request("/c")]);
  assert.equal(calls.filter((c) => c === "POST /auth/refresh").length, 1);
});

test("failed refresh throws ApiError 401 and announces session expiry", async () => {
  handler = () => json(401, { message: "Session expired" });
  await assert.rejects(request("/weddings/mine"), (e: unknown) => e instanceof ApiError && e.status === 401);
  assert.deepEqual(events, [SESSION_EXPIRED_EVENT]);
});

test("credential endpoints never trigger a refresh", async () => {
  handler = () => json(401, { message: "Invalid email or password" });
  await assert.rejects(request("/auth/login", { method: "POST", body: "{}" }), /Invalid email or password/);
  assert.deepEqual(calls, ["POST /auth/login"]);
});

test("identical in-flight GETs share one fetch; aborting one caller keeps the other", async () => {
  handler = async () => {
    await new Promise((r) => setTimeout(r, 10));
    return json(200, { n: 1 });
  };
  const controller = new AbortController();
  const a = request("/vendors", { signal: controller.signal });
  const b = request("/vendors");
  controller.abort();
  await assert.rejects(a, { name: "AbortError" });
  assert.deepEqual(await b, { n: 1 });
  assert.equal(calls.length, 1);
});

test("array validation messages are joined", async () => {
  handler = () => json(400, { message: ["name required", "email invalid"] });
  await assert.rejects(request("/x", { method: "POST", body: "{}" }), /name required, email invalid/);
});
