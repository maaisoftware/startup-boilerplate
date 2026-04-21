import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { subscriberStatus } from "./enums.ts";

/**
 * Newsletter definitions. Each newsletter has many subscribers.
 */
export const newsletters = pgTable(
  "newsletters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("newsletters_slug_key").on(table.slug)],
);

/**
 * Newsletter subscribers. Double-opt-in: status transitions
 * pending → confirmed → unsubscribed. Users can insert their own
 * pending row; admins manage state beyond that.
 */
export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    newsletterId: uuid("newsletter_id").notNull(),
    status: subscriberStatus("status").notNull().default("pending"),
    confirmationToken: text("confirmation_token"),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("subscribers_newsletter_email_key").on(
      table.newsletterId,
      table.email,
    ),
  ],
);

export type Newsletter = typeof newsletters.$inferSelect;
export type NewNewsletter = typeof newsletters.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
