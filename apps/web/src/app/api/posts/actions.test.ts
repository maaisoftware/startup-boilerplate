import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  PermissionDeniedError,
  type AppSession,
} from "@startup-boilerplate/auth";
import { auditLog, closeDb, getDb, posts } from "@startup-boilerplate/db";

import { createPost } from "./actions.ts";

/**
 * Integration test: the pure business-logic function against the real
 * local Supabase. Auto-skips when the DB is unreachable so CI without
 * a local stack stays green.
 */

const DB_URL =
  process.env["SUPABASE_DB_URL"] ??
  "postgresql://postgres:postgres@127.0.0.1:54422/postgres";

const describeIfDb = await (async () => {
  try {
    const { default: postgres } = await import("postgres");
    const probe = postgres(DB_URL, {
      max: 1,
      idle_timeout: 1,
      connect_timeout: 2,
    });
    await probe`select 1`;
    await probe.end({ timeout: 1 });
    return describe;
  } catch {
    return describe.skip;
  }
})();

const testUserId = "00000000-0000-0000-0000-000000000001";

const editorSession: AppSession = {
  user: { id: testUserId, email: "editor@example.com" },
  role: "editor",
};

const viewerSession: AppSession = {
  user: { id: testUserId, email: "viewer@example.com" },
  role: "viewer",
};

/** Fresh slug per test — audit_log is append-only so we cannot clean it. */
function uniqueSlug(label: string): string {
  return `itest-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describeIfDb("createPost — integration", () => {
  beforeAll(async () => {
    process.env["AUTH_SECRET"] ??= "a".repeat(40);
    process.env["CSRF_SECRET"] ??= "b".repeat(40);
    process.env["NEXT_PUBLIC_APP_URL"] ??= "http://localhost:3000";
    process.env["NEXT_PUBLIC_APP_NAME"] ??= "Test";
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ??= "http://127.0.0.1:54421";
    process.env["SUPABASE_DB_URL"] = DB_URL;

    // Seed a test user into auth.users so posts.author_id FK resolves.
    // Supabase's GoTrue doesn't require encrypted_password for
    // authenticated-role inserts, but it wants a few non-null fields.
    const db = getDb();
    await db.execute(sql`
      insert into auth.users (
        id, instance_id, email, aud, role,
        encrypted_password, email_confirmed_at, created_at, updated_at
      ) values (
        ${testUserId}::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'editor@example.com',
        'authenticated',
        'authenticated',
        '',
        now(), now(), now()
      )
      on conflict (id) do nothing
    `);
  });

  afterAll(async () => {
    // Clean up posts — audit_log rows stay (append-only by design), and
    // the test auth.users row stays too: deleting it would cascade an
    // UPDATE on audit_log.user_id that the immutability trigger blocks.
    // The same user-id is reused across runs, so accumulating rows is
    // bounded in practice.
    const db = getDb();
    await db.delete(posts).where(eq(posts.authorId, testUserId));
    await closeDb();
  });

  it("rejects viewer with PermissionDeniedError", async () => {
    await expect(
      createPost(viewerSession, {
        title: "Nope",
        slug: uniqueSlug("viewer"),
        contentMarkdown: "",
        status: "draft",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("creates a draft post as editor and returns its id + slug", async () => {
    const slug = uniqueSlug("draft");
    const result = await createPost(editorSession, {
      title: "Integration test post",
      slug,
      contentMarkdown: "body",
      status: "draft",
    });
    expect(result.slug).toBe(slug);
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);

    const db = getDb();
    const [row] = await db.select().from(posts).where(eq(posts.id, result.id));
    expect(row?.title).toBe("Integration test post");
    expect(row?.status).toBe("draft");
    expect(row?.publishedAt).toBeNull();
    expect(row?.authorId).toBe(testUserId);
  });

  it("sets publishedAt when status is 'published'", async () => {
    const result = await createPost(editorSession, {
      title: "Published",
      slug: uniqueSlug("pub"),
      contentMarkdown: "hi",
      status: "published",
    });
    const db = getDb();
    const [row] = await db.select().from(posts).where(eq(posts.id, result.id));
    expect(row?.status).toBe("published");
    expect(row?.publishedAt).toBeInstanceOf(Date);
  });

  it("writes an audit_log entry on success", async () => {
    const slug = uniqueSlug("audit");
    const result = await createPost(editorSession, {
      title: "Audited",
      slug,
      contentMarkdown: "",
      status: "draft",
    });
    const db = getDb();
    const audits = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.action, "post.create"),
          eq(auditLog.resourceId, result.id),
        ),
      );
    expect(audits).toHaveLength(1);
    const [entry] = audits;
    expect(entry?.userId).toBe(testUserId);
    expect(entry?.resourceType).toBe("post");
    expect(entry?.metadata).toMatchObject({ slug, status: "draft" });
  });

  it("propagates unique-slug violations as Postgres errors", async () => {
    const slug = uniqueSlug("dupe");
    await createPost(editorSession, {
      title: "First",
      slug,
      contentMarkdown: "",
      status: "draft",
    });
    await expect(
      createPost(editorSession, {
        title: "Duplicate",
        slug,
        contentMarkdown: "",
        status: "draft",
      }),
    ).rejects.toThrow();
  });
});
