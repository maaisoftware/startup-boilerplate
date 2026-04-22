/**
 * Zod schemas for environment variables.
 *
 * Two shapes: `serverSchema` (secrets + server-only config) and
 * `clientSchema` (NEXT_PUBLIC_* vars safe to ship to the browser).
 * `fullSchema` merges them — used at boot to validate the whole process.env.
 *
 * Any variable documented in `.env.example` MUST also appear here,
 * otherwise boot validation will either miss it (if optional) or refuse
 * the legitimate runtime value.
 *
 * When adding a variable:
 *   1. Add the line to `.env.example` with the same marker.
 *   2. Add an entry here with a matching type.
 *   3. If runtime reads it, import via `getServerEnv()` or `getClientEnv()`.
 */

import { z } from "zod";

// ─── Enums shared by server and client ──────────────────────────────────────
const nodeEnv = z.enum(["development", "production", "test"]);

const loggerProvider = z.enum(["console", "sentry", "datadog"]);
const analyticsProvider = z.enum(["noop", "posthog", "mixpanel", "ga4"]);
const featureFlagsProvider = z.enum(["env", "posthog", "launchdarkly"]);
const paymentsProvider = z.enum(["noop", "stripe", "paddle", "lemonsqueezy"]);
const automationsProvider = z.enum(["noop", "n8n"]);
const cmsProvider = z.enum(["builtin"]);
const docsEngineProvider = z.enum(["vault"]);
const rateLimitProvider = z.enum(["memory", "upstash"]);

/**
 * Boolean-valued env var encoded as the strings "true" or "false".
 * Defaults are applied as strings before transform so Zod 4's default-handling
 * (which skips the transform for `.default(...)` applied after a transform)
 * does not leak a string through into a boolean field.
 */
const booleanString = (defaultValue: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");

const nonEmpty = z.string().min(1);
const secret32 = z.string().min(32, "must be at least 32 characters");
const url = z.url();

/**
 * dotenv and most env sources represent "unset" as an empty string rather
 * than a missing key. Collapse empty strings back into `undefined` so
 * `.optional()` works as expected when users leave a line in place but
 * blank out the value.
 */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.length === 0 ? undefined : value;

const optionalNonEmpty = z.preprocess(emptyToUndefined, nonEmpty.optional());
const optionalUrl = z.preprocess(emptyToUndefined, url.optional());

/**
 * Server-only variables. Never reach the browser.
 * Zod parses missing optional fields as `undefined`.
 */
export const serverSchema = z.object({
  // Core
  NODE_ENV: nodeEnv.default("development"),
  AUTH_SECRET: secret32,
  CSRF_SECRET: secret32,

  // Supabase (server-only write path)
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,
  SUPABASE_DB_URL: url,
  SUPABASE_PROJECT_ID: optionalNonEmpty,

  // Provider selection
  LOGGER_PROVIDER: loggerProvider.default("console"),
  ANALYTICS_PROVIDER: analyticsProvider.default("noop"),
  FEATURE_FLAGS_PROVIDER: featureFlagsProvider.default("env"),
  PAYMENTS_PROVIDER: paymentsProvider.default("noop"),
  AUTOMATIONS_PROVIDER: automationsProvider.default("noop"),
  CMS_PROVIDER: cmsProvider.default("builtin"),
  DOCS_ENGINE_PROVIDER: docsEngineProvider.default("vault"),
  RATE_LIMIT_PROVIDER: rateLimitProvider.default("memory"),

  // Sentry (server)
  SENTRY_DSN: optionalNonEmpty,
  SENTRY_ORG: optionalNonEmpty,
  SENTRY_PROJECT: optionalNonEmpty,
  SENTRY_AUTH_TOKEN: optionalNonEmpty,

  // Datadog (server)
  DATADOG_API_KEY: optionalNonEmpty,
  DATADOG_SITE: optionalNonEmpty, // "datadoghq.com" (default), "datadoghq.eu", "us3.datadoghq.com"
  DATADOG_SERVICE: optionalNonEmpty, // service facet; defaults unset

  // PostHog (server)
  POSTHOG_API_KEY: optionalNonEmpty,

  // Mixpanel (server)
  MIXPANEL_TOKEN: optionalNonEmpty,
  MIXPANEL_API_HOST: optionalUrl, // override for EU residency (e.g. https://api-eu.mixpanel.com)

  // GA4 Measurement Protocol (server)
  GA4_MEASUREMENT_ID: optionalNonEmpty, // G-XXXXXXXXXX
  GA4_API_SECRET: optionalNonEmpty,

  // LaunchDarkly (server)
  LAUNCHDARKLY_SDK_KEY: optionalNonEmpty,
  LAUNCHDARKLY_ENDPOINT: optionalUrl, // override for EU / relay proxy

  // Stripe
  STRIPE_SECRET_KEY: optionalNonEmpty,
  STRIPE_WEBHOOK_SECRET: optionalNonEmpty,

  // Paddle Billing (server)
  PADDLE_API_KEY: optionalNonEmpty,
  PADDLE_WEBHOOK_SECRET: optionalNonEmpty,
  PADDLE_ENDPOINT: optionalUrl, // sandbox override, e.g. https://sandbox-api.paddle.com

  // Lemon Squeezy (server)
  LEMONSQUEEZY_API_KEY: optionalNonEmpty,
  LEMONSQUEEZY_WEBHOOK_SECRET: optionalNonEmpty,
  LEMONSQUEEZY_STORE_ID: optionalNonEmpty,

  // n8n
  N8N_WEBHOOK_URL: optionalUrl,
  N8N_WEBHOOK_SECRET: optionalNonEmpty,

  // Feature flags via env adapter
  FEATURE_STRIPE_CHECKOUT: booleanString("false"),
  FEATURE_NEWSLETTER: booleanString("false"),
  FEATURE_COMMENTS: booleanString("false"),
  FEATURE_AUDIT_LOG_VIEWER: booleanString("true"),
  FEATURE_ADMIN_UI: booleanString("true"),

  // Rate limiter
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmpty,

  // Deploy (dormant unless used)
  VERCEL_TOKEN: optionalNonEmpty,
  VERCEL_ORG_ID: optionalNonEmpty,
  VERCEL_PROJECT_ID: optionalNonEmpty,
});

/**
 * Client-exposed variables. Every one must start with `NEXT_PUBLIC_` —
 * that's how Next.js embeds them into the client bundle.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: url,
  NEXT_PUBLIC_APP_NAME: nonEmpty,
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmpty,
  NEXT_PUBLIC_SENTRY_DSN: optionalNonEmpty,
  NEXT_PUBLIC_POSTHOG_KEY: optionalNonEmpty,
  NEXT_PUBLIC_POSTHOG_HOST: url.default("https://us.i.posthog.com"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalNonEmpty,
});

/** Full schema — used at server boot to validate process.env as a whole. */
export const fullSchema = z.object({
  ...serverSchema.shape,
  ...clientSchema.shape,
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type FullEnv = z.infer<typeof fullSchema>;
