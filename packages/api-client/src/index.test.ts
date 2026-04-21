import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { apiFetch, ApiError, okSchema } from "./index.ts";

const originalFetch = globalThis.fetch;

function fakeFetch(status: number, body: unknown) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

beforeEach(() => {
  // fresh
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("apiFetch", () => {
  it("rejects non-/api paths", async () => {
    await expect(
      apiFetch("https://evil.example.com/data", z.unknown()),
    ).rejects.toMatchObject({ code: "client.invalid_path" });
  });

  it("parses the response with the schema", async () => {
    globalThis.fetch = fakeFetch(200, { ok: true });
    const result = await apiFetch("/api/health", okSchema);
    expect(result).toEqual({ ok: true });
  });

  it("throws ApiError with code/message/details on non-2xx", async () => {
    globalThis.fetch = fakeFetch(403, {
      code: "auth.forbidden",
      message: "nope",
      details: { resource: "post" },
    });
    await expect(apiFetch("/api/posts", z.unknown())).rejects.toMatchObject({
      status: 403,
      code: "auth.forbidden",
      message: "nope",
      details: { resource: "post" },
    });
  });

  it("sends the json body and content-type header", async () => {
    const spy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );
    globalThis.fetch = spy;
    await apiFetch("/api/x", okSchema, {
      method: "POST",
      json: { a: 1 },
      csrfToken: "token-abc",
    });
    const call = spy.mock.calls[0] as unknown as
      | [string, RequestInit]
      | undefined;
    expect(call).toBeDefined();
    const url = call?.[0];
    const init: RequestInit = call?.[1] ?? {};
    expect(url).toBe("/api/x");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    const headers = new Headers(init.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-csrf-token")).toBe("token-abc");
  });

  it("throws a parse error when the server returns an unexpected shape", async () => {
    globalThis.fetch = fakeFetch(200, { unexpected: true });
    await expect(apiFetch("/api/x", okSchema)).rejects.toBeInstanceOf(Error);
  });

  it("handles a non-JSON 500 with a default code", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response("not json", { status: 500 })),
    );
    await expect(apiFetch("/api/x", okSchema)).rejects.toMatchObject({
      status: 500,
      code: "api.error",
    });
  });

  it("ApiError is an Error subclass", () => {
    const e = new ApiError(400, "x.y", "message");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ApiError");
  });
});
