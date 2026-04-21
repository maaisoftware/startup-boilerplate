import { z } from "zod";

import { requirePermission, type AppSession } from "@startup-boilerplate/auth";
import { getDb, posts } from "@startup-boilerplate/db";

import { writeAudit } from "../../../lib/audit";

/**
 * Input schema for creating a post. Exported so the client-side form
 * can re-use the same Zod rules for validation symmetry.
 */
export const createPostInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  excerpt: z.string().max(500).optional(),
  contentMarkdown: z.string().default(""),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export interface CreatePostMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreatedPost {
  id: string;
  slug: string;
}

/**
 * Pure business-logic function: create a post as an authenticated caller.
 *
 * Split out from the HTTP handler so integration tests can exercise the
 * DB write + audit entry without spinning up Next.js. The route file
 * wraps this with the API handler, Zod validation, and session resolution.
 *
 * Throws:
 *   - PermissionDeniedError if the session role can't create posts.
 *   - Drizzle/Postgres errors bubble up (unique slug violation etc.);
 *     the caller's apiHandler wrapper maps them to 500.
 */
export async function createPost(
  session: AppSession,
  input: CreatePostInput,
  metadata: CreatePostMetadata = {},
): Promise<CreatedPost> {
  requirePermission(session.role, "post", "create");

  const db = getDb();
  const [created] = await db
    .insert(posts)
    .values({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      contentMarkdown: input.contentMarkdown,
      status: input.status,
      authorId: session.user.id,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id, slug: posts.slug });

  if (!created) {
    throw new Error("post insert returned no rows");
  }

  await writeAudit({
    userId: session.user.id,
    action: "post.create",
    resourceType: "post",
    resourceId: created.id,
    metadata: { slug: input.slug, status: input.status },
    ipAddress: metadata.ipAddress ?? null,
    userAgent: metadata.userAgent ?? null,
  });

  return created;
}
