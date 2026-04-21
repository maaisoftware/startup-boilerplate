import { bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Media records. File bytes live in Supabase Storage (or S3); this table
 * holds metadata for joining and rendering.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  alt: text("alt"),
  uploadedBy: uuid("uploaded_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
