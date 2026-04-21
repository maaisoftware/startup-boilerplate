"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { apiFetch, ApiError } from "@startup-boilerplate/api-client";
import { Button } from "@startup-boilerplate/ui";

const responseSchema = z.object({
  id: z.string(),
  slug: z.string(),
});

/**
 * Admin form that submits through POST /api/posts. The client schema
 * intentionally duplicates the server's input schema keys — we're not
 * yet sharing a single schema file across the boundary, a follow-up
 * can extract it if the duplication becomes a maintenance burden.
 */
export function NewPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiFetch("/api/posts", responseSchema, {
        method: "POST",
        json: {
          title,
          slug,
          excerpt: excerpt || undefined,
          contentMarkdown,
          status,
        },
      });
      router.push(`/blog/${result.slug}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : "Unknown error.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="max-w-xl space-y-4"
    >
      <label className="block text-sm">
        <span className="text-neutral-300">Title</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-300">Slug</span>
        <input
          required
          pattern="[a-z0-9-]+"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="lowercase-kebab-case"
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-300">Excerpt (optional)</span>
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-300">Content (Markdown)</span>
        <textarea
          value={contentMarkdown}
          onChange={(e) => setContentMarkdown(e.target.value)}
          rows={10}
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-neutral-300">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="mt-1 block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 focus:border-neutral-500 focus:outline-none"
        >
          <option value="draft">Draft</option>
          <option value="published">Publish now</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save post"}
      </Button>
    </form>
  );
}
