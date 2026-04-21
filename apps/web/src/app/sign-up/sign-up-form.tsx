"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@startup-boilerplate/auth/client";
import { Button } from "@startup-boilerplate/ui";

/**
 * Sign-up form. Creates a Supabase auth user via signUp. If email
 * confirmation is enabled (auth.email.enable_confirmations in
 * supabase/config.toml), the user receives a confirmation link in
 * Inbucket at http://127.0.0.1:54424 during local dev.
 */
export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }
      if (data.user && !data.session) {
        setMessage(
          "Check your inbox (Inbucket at :54424 in local dev) for a confirmation link.",
        );
      } else {
        setMessage("Account created. You can now sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
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
          minLength={6}
          autoComplete="new-password"
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
      {message && (
        <p role="status" className="text-sm text-emerald-400">
          {message}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create account"}
      </Button>
      <p className="text-xs text-neutral-500">
        Have an account?{" "}
        <a href="/sign-in" className="underline hover:text-neutral-300">
          Sign in
        </a>
        .
      </p>
    </form>
  );
}
