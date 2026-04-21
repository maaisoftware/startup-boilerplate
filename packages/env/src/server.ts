// `server-only` is a marker that throws at module-load if it ever resolves
// into a client bundle — a safety net for accidental imports from client
// components. It is intentionally NOT imported in this file because
// next.config.ts loads this module and Next.js's config loader does not
// present itself as a server context to `server-only`. Consumers that want
// the compile-time client-bundle guard import from
// `@startup-boilerplate/env/server-only` instead.

import { formatEnvError } from "./format.ts";
import { serverSchema, type ServerEnv } from "./schema.ts";

/**
 * Validates the server-only environment at boot. Crashes loudly on failure.
 * Returns a frozen record so accidental writes throw in strict mode.
 *
 * Consumers should always import `getServerEnv()` instead of
 * `process.env` — this guarantees typed access and never-undefined
 * required fields.
 */
export function validateServerEnv(
  source: Record<string, string | undefined> = process.env,
): Readonly<ServerEnv> {
  const parsed = serverSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(formatEnvError(parsed.error));
  }
  return Object.freeze(parsed.data);
}

/**
 * Lazy singleton so importing this module in tools that only need the
 * type (e.g. editor tooling) does not trigger validation failures on a
 * partial process.env.
 *
 * First call validates; subsequent calls return the cached value.
 */
let cached: Readonly<ServerEnv> | undefined;

export function getServerEnv(): Readonly<ServerEnv> {
  cached ??= validateServerEnv();
  return cached;
}

/** Reset the cache — test-only. Not exported from the barrel. */
export function __resetServerEnvCacheForTests(): void {
  cached = undefined;
}

export type { ServerEnv };
