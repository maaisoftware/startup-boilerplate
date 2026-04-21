import { describe, expect, it } from "vitest";

import {
  getSession,
  requireSession,
  UnauthorizedError,
  type AppSession,
} from "./session.ts";

interface FakeSupabaseClient {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email: string | null } | null };
    }>;
  };
  from: (table: string) => FakeQuery;
}

interface FakeQuery {
  select: (cols: string) => FakeQuery;
  eq: (col: string, val: string) => FakeQuery;
  maybeSingle: <T>() => Promise<{ data: T | null }>;
}

function fakeClient(
  user: { id: string; email: string | null } | null,
  role: string | null,
): FakeSupabaseClient {
  const query: FakeQuery = {
    select: () => query,
    eq: () => query,
    maybeSingle: <T>() =>
      Promise.resolve({ data: (role === null ? null : { role }) as T | null }),
  };
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user } }),
    },
    from: () => query,
  };
}

describe("getSession", () => {
  it("returns null when the user is anonymous", async () => {
    const client = fakeClient(null, null);
    const session = await getSession(
      client as unknown as Parameters<typeof getSession>[0],
    );
    expect(session).toBeNull();
  });

  it("returns session with resolved role", async () => {
    const client = fakeClient({ id: "u_1", email: "u@example.com" }, "admin");
    const session = await getSession(
      client as unknown as Parameters<typeof getSession>[0],
    );
    expect(session).toEqual<AppSession>({
      user: { id: "u_1", email: "u@example.com" },
      role: "admin",
    });
  });

  it("defaults role to 'viewer' when user_roles row is absent", async () => {
    const client = fakeClient({ id: "u_2", email: null }, null);
    const session = await getSession(
      client as unknown as Parameters<typeof getSession>[0],
    );
    expect(session?.role).toBe("viewer");
    expect(session?.user.email).toBeNull();
  });
});

describe("requireSession", () => {
  it("passes through when session exists", () => {
    const session: AppSession = {
      user: { id: "u", email: "x@example.com" },
      role: "viewer",
    };
    expect(() => requireSession(session)).not.toThrow();
  });

  it("throws UnauthorizedError when session is null", () => {
    expect(() => requireSession(null)).toThrow(UnauthorizedError);
  });
});
