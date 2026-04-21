import { formatEnvError } from "./format.ts";
import { clientSchema, type ClientEnv } from "./schema.ts";

/**
 * Validates client-exposed (NEXT_PUBLIC_*) environment at module load.
 * Safe to import in React client components — Next.js inlines the matching
 * variables at build time.
 *
 * At runtime on the client, `process.env` is a frozen object containing
 * only the inlined NEXT_PUBLIC_* values. On the server it's the full
 * process.env. Either works — the schema only describes the public shape.
 */
export function validateClientEnv(
  source: Record<string, string | undefined> = process.env,
): Readonly<ClientEnv> {
  const parsed = clientSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(formatEnvError(parsed.error));
  }
  return Object.freeze(parsed.data);
}

let cached: Readonly<ClientEnv> | undefined;

export function getClientEnv(): Readonly<ClientEnv> {
  cached ??= validateClientEnv();
  return cached;
}

/** Reset the cache — test-only. Not exported from the barrel. */
export function __resetClientEnvCacheForTests(): void {
  cached = undefined;
}

export type { ClientEnv };
