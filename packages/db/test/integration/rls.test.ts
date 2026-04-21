/**
 * Integration tests against a real local Supabase. Requires `supabase start`
 * to be running on the shifted ports (54421/54422). Tests verify that RLS
 * policies behave as documented in the migration.
 *
 * These tests are gated by the presence of SUPABASE_DB_URL pointing at a
 * reachable local instance — if the DB is unreachable, the suite is
 * skipped so CI without a local DB stays green.
 */
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "../../src/schema/index.ts";

const DB_URL =
  process.env["SUPABASE_DB_URL"] ??
  "postgresql://postgres:postgres@127.0.0.1:54422/postgres";

const describeIfDb = await (async () => {
  try {
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

type DB = ReturnType<typeof drizzle<typeof schema>>;

let pg: ReturnType<typeof postgres>;
let db: DB;

/** Run a block as the anon role inside a single transaction. */
function asAnon<T>(fn: (tx: typeof pg) => Promise<T>): Promise<T> {
  return pg.begin(async (tx) => {
    await tx`set local role anon`;
    return fn(tx as unknown as typeof pg);
  }) as unknown as Promise<T>;
}

describeIfDb("RLS policies — integration", () => {
  beforeAll(() => {
    pg = postgres(DB_URL, { max: 3, prepare: false });
    db = drizzle(pg, { schema });
  });

  afterAll(async () => {
    await pg.end({ timeout: 5 });
  });

  it("every table in the public schema has RLS enabled", async () => {
    const rows = await db.execute<{
      tablename: string;
      rls_enabled: boolean;
    }>(sql`
      select tablename, rowsecurity as rls_enabled
      from pg_tables
      where schemaname = 'public'
      order by tablename
    `);
    const disabled = rows.filter((r) => !r.rls_enabled);
    expect(
      disabled,
      `tables missing RLS: ${disabled.map((r) => r.tablename).join(", ")}`,
    ).toEqual([]);
  });

  it("exposes has_role(), is_staff(), set_updated_at(), audit_log_immutable()", async () => {
    const rows = await db.execute<{ proname: string }>(sql`
      select proname from pg_proc
      where pronamespace = 'public'::regnamespace
      and proname in ('has_role', 'is_staff', 'set_updated_at', 'audit_log_immutable')
      order by proname
    `);
    expect(rows.map((r) => r.proname)).toEqual([
      "audit_log_immutable",
      "has_role",
      "is_staff",
      "set_updated_at",
    ]);
  });

  it("seeded a published post that anon role can read", async () => {
    const rows = await asAnon(
      async (tx) => tx<{ slug: string; status: string }[]>`
        select slug, status from public.posts where slug = 'hello-world'
      `,
    );
    expect(rows[0]).toBeDefined();
    expect(rows[0]?.status).toBe("published");
  });

  it("anon cannot read draft posts", async () => {
    await pg`
      insert into public.posts (slug, title, status)
      values ('draft-post-rls', 'Draft', 'draft')
      on conflict (slug) do nothing
    `;
    const rows = await asAnon(
      async (tx) => tx<{ slug: string }[]>`
        select slug from public.posts where slug = 'draft-post-rls'
      `,
    );
    expect(rows).toEqual([]);
  });

  it("audit_log rejects UPDATE via the immutability trigger", async () => {
    await pg`
      insert into public.audit_log (action, resource_type, resource_id)
      values ('test.event', 'test', 'rls-r1')
    `;
    await expect(
      pg`update public.audit_log set action = 'changed' where resource_id = 'rls-r1'`,
    ).rejects.toThrow(/audit_log is append-only/);
  });

  it("audit_log rejects DELETE via the immutability trigger", async () => {
    await pg`
      insert into public.audit_log (action, resource_type, resource_id)
      values ('test.event', 'test', 'rls-r2')
    `;
    await expect(
      pg`delete from public.audit_log where resource_id = 'rls-r2'`,
    ).rejects.toThrow(/audit_log is append-only/);
  });

  it("subscribers: anon can only insert rows with status='pending'", async () => {
    await pg`
      insert into public.newsletters (slug, title)
      values ('rls-probe', 'RLS Probe')
      on conflict (slug) do nothing
    `;
    const newsletter = await pg<{ id: string }[]>`
      select id from public.newsletters where slug = 'rls-probe'
    `;
    const id = newsletter[0]?.id;
    expect(id).toBeTruthy();
    if (!id) return;

    // Pending insert must succeed. Anon has no SELECT on subscribers so
    // RETURNING would fail with "permission denied" even though the insert
    // itself is allowed — skip RETURNING in favour of affected-row count.
    const inserted = await asAnon(
      async (tx) => tx`
        insert into public.subscribers (email, newsletter_id)
        values ('anon@example.com', ${id})
        on conflict do nothing
      `,
    );
    expect(inserted.count).toBeGreaterThanOrEqual(0);

    // Forcing status=confirmed must fail the with-check.
    await expect(
      asAnon(
        async (tx) => tx`
          insert into public.subscribers (email, newsletter_id, status)
          values ('confirmed-probe@example.com', ${id}, 'confirmed')
        `,
      ),
    ).rejects.toThrow();
  });

  it("navigation: public read works, public write is blocked", async () => {
    const rows = await asAnon(
      async (tx) => tx<{ count: string }[]>`
        select count(*)::text as count from public.navigation
      `,
    );
    const count = rows[0]?.count;
    expect(Number(count)).toBeGreaterThan(0);

    await expect(
      asAnon(
        async (tx) => tx`
          insert into public.navigation (label, href) values ('Home', '/')
        `,
      ),
    ).rejects.toThrow();
  });

  it("newsletters: public read works, public write is blocked", async () => {
    const rows = await asAnon(
      async (tx) => tx<{ slug: string }[]>`
        select slug from public.newsletters order by slug
      `,
    );
    expect(rows.length).toBeGreaterThan(0);

    await expect(
      asAnon(
        async (tx) => tx`
          insert into public.newsletters (slug, title) values ('blocked', 'Blocked')
        `,
      ),
    ).rejects.toThrow();
  });
});
