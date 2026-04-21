import { pgEnum } from "drizzle-orm/pg-core";

/** Role assigned to a user. RBAC policies in packages/auth reference these. */
export const appRole = pgEnum("app_role", ["admin", "editor", "viewer"]);

/** Lifecycle state for posts and pages. Drives public visibility and RLS. */
export const contentStatus = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

/** Subscription status for newsletter subscribers. */
export const subscriberStatus = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);
