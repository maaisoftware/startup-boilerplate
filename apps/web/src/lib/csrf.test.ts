import { describe, expect, it } from "vitest";

import { generateCsrfToken, verifyCsrfToken } from "./csrf.ts";

// The env validator reads AUTH_SECRET and CSRF_SECRET from process.env.
// Tests set these up once up-front — they must be 32+ chars.
process.env["AUTH_SECRET"] ??= "a".repeat(40);
process.env["CSRF_SECRET"] ??= "b".repeat(40);
process.env["NEXT_PUBLIC_APP_URL"] ??= "http://localhost:3000";
process.env["NEXT_PUBLIC_APP_NAME"] ??= "Test";
process.env["NEXT_PUBLIC_SUPABASE_URL"] ??= "http://127.0.0.1:54421";
process.env["SUPABASE_DB_URL"] ??=
  "postgresql://postgres:postgres@127.0.0.1:54422/postgres";

describe("CSRF token", () => {
  it("round-trips a freshly generated token", async () => {
    const token = await generateCsrfToken();
    const result = await verifyCsrfToken(token);
    expect(result).toEqual({ valid: true });
  });

  it("rejects a missing token", async () => {
    expect(await verifyCsrfToken(undefined)).toMatchObject({
      valid: false,
      reason: "malformed",
    });
    expect(await verifyCsrfToken("")).toMatchObject({
      valid: false,
      reason: "malformed",
    });
  });

  it("rejects a malformed token", async () => {
    expect(await verifyCsrfToken("not.a.valid.token.shape")).toMatchObject({
      valid: false,
    });
  });

  it("rejects a token from the future (wrong version)", async () => {
    const token = await generateCsrfToken();
    const [, nonce, expires, sig] = token.split(".");
    const forged = `v2.${nonce}.${expires}.${sig}`;
    expect(await verifyCsrfToken(forged)).toMatchObject({
      valid: false,
      reason: "unsupported_version",
    });
  });

  it("rejects a token whose signature has been tampered with", async () => {
    const token = await generateCsrfToken();
    const tampered = `${token.slice(0, -4)}AAAA`;
    expect(await verifyCsrfToken(tampered)).toMatchObject({
      valid: false,
      reason: "signature_mismatch",
    });
  });

  it("rejects an expired token", async () => {
    const token = await generateCsrfToken(Date.now() - 1000 * 60 * 60 * 24);
    expect(await verifyCsrfToken(token)).toMatchObject({
      valid: false,
      reason: "expired",
    });
  });
});
