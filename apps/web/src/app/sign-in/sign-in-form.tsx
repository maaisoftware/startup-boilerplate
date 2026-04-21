"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@startup-boilerplate/auth/client";
import { Button } from "@startup-boilerplate/ui";

/**
 * Sign-in form. Calls Supabase's auth directly from the browser — the
 * browser client uses the anon key (RLS-gated) and is the only
 * sanctioned path for auth requests; they do not go through /api/*.
 *
 * On success, the Supabase cookies are set by @supabase/ssr and the
 * user is redirected to /admin (which re-validates session server-side).
 */
export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setSubmitting(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="max-w-sm space-y-4"
    >
      <label className="block text-sm">
        <span className="text-neutral-300">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-300">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-xs text-neutral-500">
        New here?{" "}
        <a href="/sign-up" className="underline hover:text-neutral-300">
          Create an account
        </a>
        .
      </p>
    </form>
  );
}
