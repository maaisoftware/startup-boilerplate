import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { appRole } from "./enums.ts";

/**
 * Role assignments per user. Joined to auth.users by id. A user may have
 * at most one row (primary-key on user_id). RBAC evaluations in
 * packages/auth read this table; RLS policies use a helper SQL function
 * `public.has_role(uid, role)` defined in the migration.
 */
export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").primaryKey(),
  role: appRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
