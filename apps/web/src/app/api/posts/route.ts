import { requireSession } from "@startup-boilerplate/auth";

import { apiHandler } from "../../../lib/api-handler";
import { getSessionFromCookies } from "../../../lib/session";

import { createPost, createPostInputSchema } from "./actions";

/**
 * POST /api/posts — create a new post.
 *
 * Auth: editor or admin (enforced in `createPost` via requirePermission).
 * Rate limit: 10 writes/min/IP (applied in src/proxy.ts).
 * Audit: one `post.create` entry per successful response.
 */
export const POST = apiHandler({
  input: createPostInputSchema,
  requireCsrf: true,
  handler: async ({ input, request }) => {
    const session = await getSessionFromCookies();
    requireSession(session);
    return createPost(session, input, {
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });
  },
});
