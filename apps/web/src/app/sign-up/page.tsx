import type { Metadata } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { PageShell, organizationSchema } from "@startup-boilerplate/ui";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create an account. Email + password via Supabase Auth on the local stack.",
};

export default function SignUpPage() {
  const env = getClientEnv();
  return (
    <PageShell
      title="Sign up"
      description="Email + password. Already have an account? /sign-in."
      structuredData={organizationSchema({
        name: env.NEXT_PUBLIC_APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
      })}
    >
      <SignUpForm />
    </PageShell>
  );
}
