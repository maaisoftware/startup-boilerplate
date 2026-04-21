import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema/index.ts",
  out: "./drizzle/generated",
  dialect: "postgresql",
  dbCredentials: {
    // Only used by `drizzle-kit studio` and `drizzle-kit push` in local dev.
    // Migrations are authored in supabase/migrations/ and applied via
    // `supabase db push`.
    url:
      process.env["SUPABASE_DB_URL"] ??
      "postgresql://postgres:postgres@127.0.0.1:54422/postgres",
  },
  strict: true,
  verbose: true,
} satisfies Config;
