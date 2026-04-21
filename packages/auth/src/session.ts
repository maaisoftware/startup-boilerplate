import type { SupabaseClient } from "@supabase/supabase-js";

import type { Role } from "./rbac.ts";

/**
 * Minimal session shape used by app-layer code. Does not expose the raw
 * Supabase JWT or refresh token — consumers that need those interact
 * directly with the SupabaseClient. The session is what the RBAC guards
 * evaluate against.
 */
export interface AppSession {
  user: {
    id: string;
    email: string | null;
  };
  /** Role resolved from user_roles, defaulting to "viewer" when absent. */
  role: Role;
}

/**
 * Resolve the current session from a Supabase client that has been
 * constructed with access to the request cookies (see `./server.ts`).
 * Returns null for anonymous callers.
 *
 * Queries `user_roles` to pick up the role; any row with an unknown role
 * value collapses to "viewer" as a safe default.
 */
export async function getSession(
  supabase: SupabaseClient,
): Promise<AppSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: Role }>();

  return {
    user: { id: user.id, email: user.email ?? null },
    role: roleRow?.role ?? "viewer",
  };
}

/**
 * Throw unless the caller is authenticated. Use at the top of protected
 * API routes. The thrown error carries HTTP intent — callers map it to
 * a 401 response.
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function requireSession(
  session: AppSession | null,
): asserts session is AppSession {
  if (!session) throw new UnauthorizedError();
}
