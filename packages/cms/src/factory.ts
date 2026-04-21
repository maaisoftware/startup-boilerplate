import { getDb } from "@startup-boilerplate/db";
import { getServerEnv } from "@startup-boilerplate/env/server";

import { BuiltinSupabaseCms } from "./adapters/builtin-supabase.ts";
import type { Cms } from "./interfaces.ts";

let cached: Cms | undefined;

/**
 * Returns the configured CMS singleton. `builtin` is the only shipped
 * adapter; alternatives (Sanity, Builder.io, Contentful) slot in via
 * `CMS_PROVIDER` when the env schema enum is extended.
 */
export function getCms(): Cms {
  if (cached) return cached;

  const env = getServerEnv();
  if (env.CMS_PROVIDER === "builtin") {
    cached = new BuiltinSupabaseCms(getDb());
    return cached;
  }

  // The env schema currently has only "builtin"; exhaustive switch
  // keeps the compiler honest when future enums land.
  const never: never = env.CMS_PROVIDER;
  throw new Error(`Unsupported CMS provider: ${String(never)}`);
}

export function __resetCmsCacheForTests(): void {
  cached = undefined;
}
