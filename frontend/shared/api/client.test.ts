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