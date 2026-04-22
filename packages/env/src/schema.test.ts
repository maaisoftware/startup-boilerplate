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
      expect(result.data.MIXPANEL_TOKEN).toBeUndefined();
      expect(result.data.GA4_MEASUREMENT_ID).toBeUndefined();
    }
  });

  it("accepts ANALYTICS_PROVIDER=mixpanel with token + optional host", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      ANALYTICS_PROVIDER: "mixpanel",
      MIXPANEL_TOKEN: "mp-123",
      MIXPANEL_API_HOST: "https://api-eu.mixpanel.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ANALYTICS_PROVIDER).toBe("mixpanel");
      expect(result.data.MIXPANEL_TOKEN).toBe("mp-123");
      expect(result.data.MIXPANEL_API_HOST).toBe("https://api-eu.mixpanel.com");
    }
  });

  it("rejects a malformed MIXPANEL_API_HOST", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      MIXPANEL_API_HOST: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts ANALYTICS_PROVIDER=ga4 with measurement id + secret", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      ANALYTICS_PROVIDER: "ga4",
      GA4_MEASUREMENT_ID: "G-ABC123",
      GA4_API_SECRET: "secret-value",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ANALYTICS_PROVIDER).toBe("ga4");
      expect(result.data.GA4_MEASUREMENT_ID).toBe("G-ABC123");
      expect(result.data.GA4_API_SECRET).toBe("secret-value");
    }
  });

  it("rejects an unknown ANALYTICS_PROVIDER", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      ANALYTICS_PROVIDER: "amplitude",
    });
    expect(result.success).toBe(false);
  });

  it("accepts FEATURE_FLAGS_PROVIDER=launchdarkly with SDK key", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      FEATURE_FLAGS_PROVIDER: "launchdarkly",
      LAUNCHDARKLY_SDK_KEY: "sdk-abc",
      LAUNCHDARKLY_ENDPOINT: "https://relay.example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.FEATURE_FLAGS_PROVIDER).toBe("launchdarkly");
      expect(result.data.LAUNCHDARKLY_SDK_KEY).toBe("sdk-abc");
      expect(result.data.LAUNCHDARKLY_ENDPOINT).toBe(
        "https://relay.example.com",
      );
    }
  });

  it("rejects a malformed LAUNCHDARKLY_ENDPOINT", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      LAUNCHDARKLY_ENDPOINT: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown FEATURE_FLAGS_PROVIDER", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      FEATURE_FLAGS_PROVIDER: "split",
    });
    expect(result.success).toBe(false);
  });

  it("accepts PAYMENTS_PROVIDER=paddle with api key + webhook secret", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      PAYMENTS_PROVIDER: "paddle",
      PADDLE_API_KEY: "pdl-k",
      PADDLE_WEBHOOK_SECRET: "pdl-wh",
      PADDLE_ENDPOINT: "https://sandbox-api.paddle.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PAYMENTS_PROVIDER).toBe("paddle");
      expect(result.data.PADDLE_API_KEY).toBe("pdl-k");
      expect(result.data.PADDLE_ENDPOINT).toBe(
        "https://sandbox-api.paddle.com",
      );
    }
  });

  it("accepts PAYMENTS_PROVIDER=lemonsqueezy with api key + webhook secret + store id", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      PAYMENTS_PROVIDER: "lemonsqueezy",
      LEMONSQUEEZY_API_KEY: "ls-k",
      LEMONSQUEEZY_WEBHOOK_SECRET: "ls-wh",
      LEMONSQUEEZY_STORE_ID: "42",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PAYMENTS_PROVIDER).toBe("lemonsqueezy");
      expect(result.data.LEMONSQUEEZY_STORE_ID).toBe("42");
    }
  });

  it("rejects a malformed PADDLE_ENDPOINT", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      PADDLE_ENDPOINT: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown PAYMENTS_PROVIDER", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      PAYMENTS_PROVIDER: "braintree",
    });
    expect(result.success).toBe(false);
  });

  it("accepts CMS_PROVIDER=sanity with project id + dataset", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      CMS_PROVIDER: "sanity",
      SANITY_PROJECT_ID: "proj-123",
      SANITY_DATASET: "production",
      SANITY_API_VERSION: "2024-10-01",
      SANITY_API_TOKEN: "sk-token",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CMS_PROVIDER).toBe("sanity");
      expect(result.data.SANITY_PROJECT_ID).toBe("proj-123");
      expect(result.data.SANITY_DATASET).toBe("production");
    }
  });

  it("rejects an unknown CMS_PROVIDER", () => {
    const result = serverSchema.safeParse({
      ...baseServer,
      CMS_PROVIDER: "contentful",
    });
    expect(result.success).toBe(false);
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
