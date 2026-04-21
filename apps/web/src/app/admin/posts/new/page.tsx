import type { Metadata } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { PageShell, organizationSchema } from "@startup-boilerplate/ui";

import { requireAdminSession } from "../../../../lib/admin-guard";

import { NewPostForm } from "./new-post-form";

export const metadata: Metadata = {
  title: "New post",
  description: "Create a blog post. Editor or admin role required.",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  // Runs on the server; redirects before rendering if not staff.
  await requireAdminSession();
  const env = getClientEnv();
  return (
    <PageShell
      title="New post"
      description="Saves through POST /api/posts with audit logging and RBAC enforcement."
      structuredData={organizationSchema({
        name: env.NEXT_PUBLIC_APP_NAME,
        url: env.NEXT_PUBLIC_APP_URL,
      })}
    >
      <NewPostForm />
    </PageShell>
  );
}
