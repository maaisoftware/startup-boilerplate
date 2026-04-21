import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe } from "vitest";

import * as schema from "@startup-boilerplate/db";

import { BuiltinSupabaseCms } from "../../src/adapters/builtin-supabase.ts";
import { runCmsContract } from "../../src/contract.ts";

const DB_URL =
  process.env["SUPABASE_DB_URL"] ??
  "postgresql://postgres:postgres@127.0.0.1:54422/postgres";

const describeIfDb = await (async () => {
  try {
    const probe = postgres(DB_URL, {
      max: 1,
      idle_timeout: 1,
      connect_timeout: 2,
    });
    await probe`select 1`;
    await probe.end({ timeout: 1 });
    return describe;
  } catch {
    return describe.skip;
  }
})();

let pg: ReturnType<typeof postgres>;

describeIfDb("BuiltinSupabaseCms — integration", () => {
  beforeAll(() => {
    pg = postgres(DB_URL, { max: 3, prepare: false });
  });

  afterAll(async () => {
    await pg.end({ timeout: 5 });
  });

  runCmsContract("BuiltinSupabaseCms", () => {
    const db = drizzle(pg, { schema });
    return new BuiltinSupabaseCms(db);
  });
});
