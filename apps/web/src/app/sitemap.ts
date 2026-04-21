import type { MetadataRoute } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getCms } from "@startup-boilerplate/cms";

/**
 * Dynamic sitemap. Next.js calls this on build + request to emit
 * /sitemap.xml. Includes every published post and page plus the root.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clientEnv = getClientEnv();
  const cms = getCms();
  const origin = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();

  const [posts, pages] = await Promise.all([
    cms.listPublishedPosts({ limit: 100 }),
    cms.listPublishedPages(),
  ]);

  return [
    { url: origin, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${origin}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...pages.map((page) => ({
      url: `${origin}/${page.slug}`,
      lastModified: page.publishedAt ? new Date(page.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.posts.map((post) => ({
      url: `${origin}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
