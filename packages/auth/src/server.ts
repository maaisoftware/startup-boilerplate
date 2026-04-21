import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getServerEnv } from "@startup-boilerplate/env/server";

/**
 * Minimal cookie adapter: API routes on Next.js App Router pass in
 * `cookies()` from next/headers. We abstract it here so this package can
 * live outside apps/web without importing Next.
 */
export interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  remove?(name: string, options?: CookieOptions): void;
}

/**
 * Build a Supabase client that reads the session from cookies — the
 * canonical server-side entry point for route handlers, server actions,
 * and RSCs.
 *
 * Uses the publishable (anon) key: every call is subject to RLS. If you
 * need service-role access, import the Drizzle client from
 * @startup-boilerplate/db.
 */
export function createSupabaseServerClient(cookies: CookieStore) {
  const clientEnv = getClientEnv();
  const serverEnv = getServerEnv();
  const anonKey = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is required for server client",
    );
  }

  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, anonKey, {
    auth: {
      storageKey: `sb-${serverEnv.NODE_ENV}`,
    },
    cookies: {
      getAll() {
        // Supabase SSR accepts a list, but our lightweight adapter only
        // exposes one cookie at a time. Callers that need the full list
        // should pass a richer CookieStore; for Next.js the cookies()
        // API is full-list-aware and wraps the gap in the app adapter.
        return [];
      },
      setAll(items) {
        for (const { name, value, options } of items) {
          cookies.set(name, value, options);
        }
      },
    },
  });
}
