import { getDb } from "@startup-boilerplate/db";
import { getServerEnv } from "@startup-boilerplate/env/server";

import { BuiltinSupabaseCms } from "./adapters/builtin-supabase.ts";
import { createFetchSanityClient, SanityCms } from "./adapters/sanity.ts";
import type { Cms } from "./interfaces.ts";

let cached: Cms | undefined;

/**
 * Returns the configured CMS singleton. Picks an adapter based on
 * `CMS_PROVIDER`. Falls through to the built-in Supabase adapter when
 * the Sanity provider is selected but its required env vars are
 * missing — keeps boot alive during partial configuration.
 */
export function getCms(): Cms {
  if (cached) return cached;

  const env = getServerEnv();

  if (
    env.CMS_PROVIDER === "sanity" &&
    env.SANITY_PROJECT_ID &&
    env.SANITY_DATASET
  ) {
    const client = createFetchSanityClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      ...(env.SANITY_API_VERSION ? { apiVersion: env.SANITY_API_VERSION } : {}),
      ...(env.SANITY_API_TOKEN ? { token: env.SANITY_API_TOKEN } : {}),
    });
    cached = new SanityCms({ client });
    return cached;
  }

  cached = new BuiltinSupabaseCms(getDb());
  return cached;
}

export function __resetCmsCacheForTests(): void {
  cached = undefined;
}
