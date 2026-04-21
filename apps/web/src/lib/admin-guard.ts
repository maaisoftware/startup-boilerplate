import { redirect } from "next/navigation";

import { canPerform, type AppSession } from "@startup-boilerplate/auth";

import { getSessionFromCookies } from "./session";

/**
 * Server-only guard for /admin/* routes. Redirects unauthenticated
 * users to /sign-in and viewer-tier users to /. Returns the AppSession
 * for the callsite to use.
 *
 * Usage from a server component:
 *
 *   const session = await requireAdminSession();
 *   // … use session.user, session.role …
 */
export async function requireAdminSession(): Promise<AppSession> {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/sign-in");
  }
  if (!canPerform(session.role, "post", "read_private")) {
    // No staff access. Send them home.
    redirect("/");
  }
  return session;
}
