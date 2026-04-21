import type { Metadata } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { PageShell, organizationSchema } from "@startup-boilerplate/ui";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your account. Email + password via Supabase Auth on the local stack.",
};

export default function SignInPage() {
  const env = getClientEnv();
  return (
    <PageShell
      title="Sign in"
      description="Email + password. New here? Head to /sign-up."
      structuredData={organizationSchema({
        name: env.NEXT_PUBLIC_APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
      })}
    >
      <SignInForm />
    </PageShell>
  );
}
