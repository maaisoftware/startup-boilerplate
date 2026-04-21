import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Site navigation entries. Flat or nested (via parent_id). Admin-managed,
 * publicly readable.
 */
export const navigation = pgTable("navigation", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  position: integer("position").notNull().default(0),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type NavigationEntry = typeof navigation.$inferSelect;
export type NewNavigationEntry = typeof navigation.$inferInsert;
