import assert from "node:assert/strict";
import { test } from "node:test";

import { apiFetch } from "./client";

test("apiFetch sends the CSRF cookie as a mutation header", async () => {
  process.env.NEXT_PUBLIC_API_URL = "http://api.test";
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { cookie: "csrf_token=csrf%20value" },
  });

  let request: RequestInit | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    request = init;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  };

  try {
    await apiFetch("/vacancies/test/applications", {
      method: "POST",
      json: {},
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete (globalThis as { document?: unknown }).document;
  }

  assert.equal(request?.credentials, "include");
  assert.equal(
    new Headers(request?.headers).get("X-CSRF-Token"),
    "csrf value",
  );
});
test("apiFetch displays validation errors without object coercion", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: [{ loc: ["path", "id"], msg: "Invalid UUID" }] }), { status: 422, headers: { "content-type": "application/json" } });
  try { await assert.rejects(apiFetch("/vacancies/demo"), /path.id: Invalid UUID/); }
  finally { globalThis.fetch = originalFetch; }
});

test("role preview is excluded from auth and developer requests", async () => {
  const { setApiPreviewRole } = await import("./client");
  const originalFetch = globalThis.fetch;
  const captured: (string | null)[] = [];
  globalThis.fetch = async (_path, init) => { captured.push(new Headers(init?.headers).get("X-Preview-Role")); return new Response("{}", { headers: { "content-type": "application/json" } }); };
  try {
    setApiPreviewRole("manager");
    await apiFetch("/vacancies/"); await apiFetch("/auth/me"); await apiFetch("/developer/access");
    assert.deepEqual(captured, ["manager", null, null]);
  } finally { setApiPreviewRole(null); globalThis.fetch = originalFetch; }
});

test("dev mode blocks live ATS calls while allowing the isolated dataset", async () => {
  const { setApiDevelopmentMode } = await import("./client");
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; return new Response("{}", { headers: { "content-type": "application/json" } }); };
  try {
    setApiDevelopmentMode(true);
    for (const path of ["/users/test", "/vacancies/", "/candidates/test/questionnaire", "/interviews/", "/copilot/settings"]) {
      await assert.rejects(apiFetch(path, { method: "DELETE" }), /Dev mode/);
    }
    assert.equal(requests, 0);
    await apiFetch("/developer/dataset");
    assert.equal(requests, 1);
    setApiDevelopmentMode(false);
    await apiFetch("/candidates/");
    assert.equal(requests, 2);
  } finally { setApiDevelopmentMode(false); globalThis.fetch = originalFetch; }
});
