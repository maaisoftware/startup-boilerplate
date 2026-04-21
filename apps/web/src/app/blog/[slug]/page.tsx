import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getCms } from "@startup-boilerplate/cms";
import { PageShell, articleSchema } from "@startup-boilerplate/ui";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cms = getCms();
  const post = await cms.getPublishedPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt ?? post.title,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? post.title,
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const cms = getCms();
  const clientEnv = getClientEnv();
  const post = await cms.getPublishedPostBySlug(slug);
  if (!post) notFound();

  const url = `${clientEnv.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`;
  return (
    <PageShell
      title={post.title}
      description={post.excerpt ?? ""}
      structuredData={articleSchema({
        headline: post.title,
        description: post.excerpt ?? post.title,
        url,
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        dateModified: post.updatedAt,
      })}
    >
      <article className="prose prose-invert max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
          {post.contentMarkdown}
        </pre>
      </article>
    </PageShell>
  );
}
