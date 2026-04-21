import { pgTable, timestamp, uuid, text } from "drizzle-orm/pg-core";

/**
 * Application profile that extends Supabase's `auth.users`. Do not store
 * PII here that isn't needed for display; real contact info lives in
 * auth.users where Supabase controls access.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
