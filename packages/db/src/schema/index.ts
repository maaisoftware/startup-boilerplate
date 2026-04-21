/**
 * Barrel for the Drizzle schema.
 *
 * Adding a new table? Create `src/schema/<name>.ts`, export the table
 * and its Row/Insert types, and re-export here. Then generate a new
 * migration: `supabase migration new add_<name>`.
 */

export * from "./audit-log.ts";
export * from "./enums.ts";
export * from "./media.ts";
export * from "./navigation.ts";
export * from "./newsletters.ts";
export * from "./pages.ts";
export * from "./posts.ts";
export * from "./profiles.ts";
export * from "./seo-overrides.ts";
export * from "./user-roles.ts";
