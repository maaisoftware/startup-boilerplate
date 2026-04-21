import Link from "next/link";
import type { Metadata } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getCms } from "@startup-boilerplate/cms";
import { PageShell, breadcrumbSchema } from "@startup-boilerplate/ui";

export const metadata: Metadata = {
  title: "Blog",
  description: "Latest posts from the Startup Boilerplate demo.",
};

export default async function BlogIndexPage() {
  const cms = getCms();
  const clientEnv = getClientEnv();
  const { posts } = await cms.listPublishedPosts({ limit: 20 });

  return (
    <PageShell
      title="Blog"
      description="Latest posts from the Startup Boilerplate demo."
      structuredData={breadcrumbSchema([
        { name: "Home", url: clientEnv.NEXT_PUBLIC_APP_URL },
        { name: "Blog", url: `${clientEnv.NEXT_PUBLIC_APP_URL}/blog` },
      ])}
    >
      {posts.length === 0 ? (
        <p className="text-neutral-400">No posts yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-neutral-800 pb-6">
              <h2 className="text-xl font-medium">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="mt-1 text-neutral-400">{post.excerpt}</p>
              )}
              {post.publishedAt && (
                <time
                  dateTime={post.publishedAt}
                  className="mt-2 block text-xs uppercase tracking-wider text-neutral-600"
                >
                  {new Date(post.publishedAt).toLocaleDateString()}
                </time>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
