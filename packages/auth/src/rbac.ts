/**
 * RBAC policy DSL.
 *
 * Roles: admin > editor > viewer. Each role inherits the permissions of
 * the roles below it. Permissions are encoded as (resource, action) pairs;
 * a policy is a declarative map from resource to the roles allowed each
 * action. This single source of truth drives:
 *
 *   - API-layer guards (`requirePermission(session, resource, action)`)
 *   - DB-level RLS policies (the generator in scripts/ will emit SQL
 *     that matches — TBD in a future PR)
 *
 * Keep the DSL small and declarative. Anything that requires logic beyond
 * "role owns permission" belongs in application code, not the DSL.
 */

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** Role hierarchy: a role implicitly owns the permissions of all roles below it. */
const ROLE_RANK: Readonly<Record<Role, number>> = Object.freeze({
  admin: 3,
  editor: 2,
  viewer: 1,
});

export function roleSatisfies(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export const RESOURCES = [
  "post",
  "page",
  "page_block",
  "media",
  "newsletter",
  "subscriber",
  "navigation",
  "seo_override",
  "audit_log",
  "user_role",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  "read",
  "read_private", // draft / staff-only content
  "create",
  "update",
  "delete",
  "publish",
] as const;
export type Action = (typeof ACTIONS)[number];

export interface Permission {
  resource: Resource;
  action: Action;
}

/** The policy: minimum role required per (resource, action). */
export const POLICY: Readonly<
  Record<Resource, Readonly<Partial<Record<Action, Role>>>>
> = Object.freeze({
  post: Object.freeze({
    read: "viewer", // published posts readable by anyone; handled in RLS
    read_private: "editor",
    create: "editor",
    update: "editor",
    delete: "admin",
    publish: "editor",
  }),
  page: Object.freeze({
    read: "viewer",
    read_private: "editor",
    create: "editor",
    update: "editor",
    delete: "admin",
    publish: "editor",
  }),
  page_block: Object.freeze({
    read: "viewer",
    create: "editor",
    update: "editor",
    delete: "editor",
  }),
  media: Object.freeze({
    read: "viewer",
    create: "viewer", // any authenticated user can upload
    update: "editor",
    delete: "editor",
  }),
  newsletter: Object.freeze({
    read: "viewer",
    create: "admin",
    update: "admin",
    delete: "admin",
  }),
  subscriber: Object.freeze({
    read: "admin",
    create: "viewer", // double-opt-in signup
    update: "admin",
    delete: "admin",
  }),
  navigation: Object.freeze({
    read: "viewer",
    create: "admin",
    update: "admin",
    delete: "admin",
  }),
  seo_override: Object.freeze({
    read: "viewer",
    create: "admin",
    update: "admin",
    delete: "admin",
  }),
  audit_log: Object.freeze({
    read: "admin",
    // No mutation entry — audit_log is append-only via service_role + trigger.
  }),
  user_role: Object.freeze({
    read: "admin",
    create: "admin",
    update: "admin",
    delete: "admin",
  }),
});

/** Returns true if `role` may perform `action` on `resource`. */
export function canPerform(
  role: Role,
  resource: Resource,
  action: Action,
): boolean {
  const required = POLICY[resource][action];
  if (required === undefined) return false; // no policy entry ⇒ denied
  return roleSatisfies(role, required);
}

/** Throwing guard. Use in API route handlers. */
export class PermissionDeniedError extends Error {
  constructor(role: Role, resource: Resource, action: Action) {
    super(
      `Permission denied: role '${role}' cannot '${action}' on '${resource}'`,
    );
    this.name = "PermissionDeniedError";
  }
}

export function requirePermission(
  role: Role,
  resource: Resource,
  action: Action,
): void {
  if (!canPerform(role, resource, action)) {
    throw new PermissionDeniedError(role, resource, action);
  }
}
