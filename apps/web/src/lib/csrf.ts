import { getServerEnv } from "@startup-boilerplate/env/server";

/**
 * CSRF token helpers — HMAC-based double-submit pattern.
 *
 * A token is generated server-side, stored in a cookie readable by the
 * browser, and then echoed back in the `x-csrf-token` header on every
 * state-changing request. The server verifies the HMAC of the header
 * value against its own secret. This prevents a third-party site from
 * triggering mutations via the user's cookies because the third party
 * cannot read the cookie value to form the header.
 */

const TOKEN_VERSION = "v1";
const TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 12; // 12 hours

async function hmac(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    keyMaterial,
    encoder.encode(data),
  );
  return Buffer.from(signature).toString("base64url");
}

export async function generateCsrfToken(
  now: number = Date.now(),
): Promise<string> {
  const env = getServerEnv();
  const nonce = crypto.randomUUID();
  const expiresAt = now + TOKEN_LIFETIME_MS;
  const payload = `${TOKEN_VERSION}.${nonce}.${expiresAt}`;
  const signature = await hmac(env.CSRF_SECRET, payload);
  return `${payload}.${signature}`;
}

export interface VerifyResult {
  valid: boolean;
  reason?:
    | "malformed"
    | "expired"
    | "signature_mismatch"
    | "unsupported_version";
}

export async function verifyCsrfToken(
  token: string | null | undefined,
  now: number = Date.now(),
): Promise<VerifyResult> {
  if (!token) return { valid: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 4) return { valid: false, reason: "malformed" };
  const [version, nonce, expiresAtStr, signature] = parts;
  if (!version || !nonce || !expiresAtStr || !signature) {
    return { valid: false, reason: "malformed" };
  }
  if (version !== TOKEN_VERSION) {
    return { valid: false, reason: "unsupported_version" };
  }
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return { valid: false, reason: "expired" };
  }
  const env = getServerEnv();
  const expected = await hmac(
    env.CSRF_SECRET,
    `${version}.${nonce}.${expiresAtStr}`,
  );
  // Constant-time compare.
  if (expected.length !== signature.length) {
    return { valid: false, reason: "signature_mismatch" };
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) return { valid: false, reason: "signature_mismatch" };
  return { valid: true };
}

export const CSRF_COOKIE_NAME = "sb_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
