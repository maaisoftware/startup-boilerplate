import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Per-route SEO overrides. Matched against `generateMetadata()` output in
 * apps/web. Publicly readable; admin-written.
 */
export const seoOverrides = pgTable(
  "seo_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routePattern: text("route_pattern").notNull(),
    title: text("title"),
    description: text("description"),
    ogImageUrl: text("og_image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("seo_overrides_route_key").on(table.routePattern)],
);

export type SeoOverride = typeof seoOverrides.$inferSelect;
export type NewSeoOverride = typeof seoOverrides.$inferInsert;
