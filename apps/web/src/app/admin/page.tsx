import Link from "next/link";
import type { Metadata } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { PageShell, organizationSchema } from "@startup-boilerplate/ui";

import { requireAdminSession } from "../../lib/admin-guard";

export const metadata: Metadata = {
  title: "Admin",
  description: "Staff dashboard. Editor or admin role required.",
  robots: { index: false, follow: false },
};

export default async function AdminHomePage() {
  const session = await requireAdminSession();
  const env = getClientEnv();
  return (
    <PageShell
      title="Admin"
      description={`Signed in as ${session.user.email ?? session.user.id} · role ${session.role}.`}
      structuredData={organizationSchema({
        name: env.NEXT_PUBLIC_APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
      })}
    >
      <ul className="space-y-3 text-neutral-200">
        <li>
          <Link
            href="/admin/posts/new"
            className="rounded-md border border-neutral-700 px-4 py-2 transition hover:border-neutral-500"
          >
            New post →
          </Link>
        </li>
      </ul>
      <p className="mt-6 text-xs text-neutral-500">
        This page is server-rendered and gated by{" "}
        <code>requireAdminSession()</code>. Viewers are redirected home;
        anonymous users to /sign-in.
      </p>
    </PageShell>
  );
}
