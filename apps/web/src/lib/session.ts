import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSession, type AppSession } from "@startup-boilerplate/auth";
import { getClientEnv } from "@startup-boilerplate/env/client";

/**
 * Resolve the AppSession from the request's cookies.
 *
 * Uses Next.js 15+ `cookies()` from next/headers (async in App Router),
 * wires a Supabase SSR client with the publishable (anon) key, and
 * delegates to `getSession()` from @startup-boilerplate/auth which
 * joins `user_roles` to populate the role field.
 *
 * Returns null for anonymous callers. Throws UnauthorizedError via
 * `requireSession()` when the caller expects a logged-in user.
 */
export async function getSessionFromCookies(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const env = getClientEnv();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    // No anon key means Supabase isn't wired yet — treat as anonymous
    // rather than crashing. Real deployments must have this set; the
    // env schema allows optional because local-only runs may skip auth.
    return null;
  }

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        for (const { name, value, options } of items) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  return getSession(supabase);
}
