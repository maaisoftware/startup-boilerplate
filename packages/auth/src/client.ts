import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@startup-boilerplate/env/client";

/**
 * Browser-side Supabase client. Picks up the session from cookies
 * managed by `@supabase/ssr`. Safe to call from client components.
 *
 * Throws at call time (not module time) if the anon key is missing so
 * that pages which never sign in do not crash at import.
 *
 * Return type is inferred from `createBrowserClient` so TS does not try
 * to line up incompatible generics between @supabase/ssr and a directly
 * imported SupabaseClient type.
 */
export function createSupabaseBrowserClient() {
  const env = getClientEnv();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is required for browser client",
    );
  }
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, anonKey);
}
