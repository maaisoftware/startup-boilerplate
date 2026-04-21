import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@startup-boilerplate/env/server";

import * as schema from "./schema/index.ts";

/**
 * Drizzle client wired to Supabase's Postgres via postgres-js. The client
 * uses the SERVICE ROLE URL (SUPABASE_DB_URL) and therefore bypasses RLS —
 * only server-side code that has already validated auth should call it.
 *
 * Production access patterns use `@supabase/supabase-js` directly from API
 * routes so RLS enforces policies. This Drizzle client exists for
 * migrations, seeders, and admin-tier background jobs.
 */
export type DrizzleClient = PostgresJsDatabase<typeof schema>;

let cached: { db: DrizzleClient; pg: ReturnType<typeof postgres> } | undefined;

export function getDb(): DrizzleClient {
  if (cached) return cached.db;
  const env = getServerEnv();
  const pg = postgres(env.SUPABASE_DB_URL, { prepare: false, max: 5 });
  const db = drizzle(pg, { schema });
  cached = { db, pg };
  return db;
}

/** Release the connection pool. Call on graceful shutdown. */
export async function closeDb(): Promise<void> {
  if (!cached) return;
  await cached.pg.end({ timeout: 5 });
  cached = undefined;
}

export * as schema from "./schema/index.ts";
