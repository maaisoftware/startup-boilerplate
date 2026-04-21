import { describe, expect, it } from "vitest";

import { clientSchema, fullSchema, serverSchema } from "./schema.ts";

const baseServer = {
  AUTH_SECRET: "a".repeat(40),
  CSRF_SECRET: "b".repeat(40),
  SUPABASE_DB_URL: "postgresql://postgres:postgres@127.0.0.1:54422/postgres",
};

const baseClient = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: "Startup Boilerplate",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54421",
};

describe("serverSchema", () => {
  it("accepts a minimal valid environment", () => {
    const result = serverSchema.safeParse(baseServer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe("development");
      expect(result.data.LOGGER_PROVIDER).toBe("console");
      expect(result.data.RATE_LIMIT_PROVIDER).toBe("memory");
      expect(result.data.FEATURE_ADMIN_UI).toBe(true);
      expect(result.data.FEATURE_STRIPE_CHECKOUT).toBe(false);
    }
  });

  it("rejects a too-short AUTH_SECRET", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      AUTH_SECRET: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const authIssue = result.error.issues.find(
        (i) => i.path[0] === "AUTH_SECRET",
      );
      expect(authIssue?.message).toMatch(/at least 32/i);
    }
  });

  it("rejects a missing CSRF_SECRET", () => {
    const { CSRF_SECRET: _omit, ...rest } = baseServer;
    const result = serverSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "CSRF_SECRET")).toBe(
        true,
      );
    }
  });

  it("rejects a malformed SUPABASE_DB_URL", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      SUPABASE_DB_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown provider value", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      LOGGER_PROVIDER: "splunk",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string booleans for feature flags", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      FEATURE_STRIPE_CHECKOUT: "true",
      FEATURE_ADMIN_UI: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.FEATURE_STRIPE_CHECKOUT).toBe(true);
      expect(result.data.FEATURE_ADMIN_UI).toBe(false);
    }
  });

  it("rejects non-boolean strings for feature flags", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      FEATURE_STRIPE_CHECKOUT: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("leaves optional keys undefined when absent", () => {
    const result = serverSchema.safeParse(baseServer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.SENTRY_DSN).toBeUndefined();
      expect(result.data.STRIPE_SECRET_KEY).toBeUndefined();
      expect(result.data.N8N_WEBHOOK_URL).toBeUndefined();
    }
  });
});

describe("clientSchema", () => {
  it("accepts a minimal valid client env", () => {
    const result = clientSchema.safeParse(baseClient);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_POSTHOG_HOST).toBe(
        "https://us.i.posthog.com",
      );
    }
  });

  it("requires NEXT_PUBLIC_APP_URL to be a URL", () => {
    const result = clientSchema.safeParse({
      ...baseClient,
      NEXT_PUBLIC_APP_URL: "local",
    });
    expect(result.success).toBe(false);
  });

  it("requires NEXT_PUBLIC_APP_NAME to be non-empty", () => {
    const result = clientSchema.safeParse({
      ...baseClient,
      NEXT_PUBLIC_APP_NAME: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("fullSchema", () => {
  it("validates both server and client shapes in one pass", () => {
    const result = fullSchema.safeParse({ ...baseServer, ...baseClient });
    expect(result.success).toBe(true);
  });

  it("reports multiple issues in a single pass", () => {
    const result = fullSchema.safeParse({
      ...baseClient,
      AUTH_SECRET: "x",
      CSRF_SECRET: "y",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // At least AUTH_SECRET + CSRF_SECRET + SUPABASE_DB_URL should fail
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });
});
