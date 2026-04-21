import type { NextConfig } from "next";

// Environment loading: the monorepo's single .env.local lives at the
// repo root. Package scripts (`pnpm dev`, `pnpm build`) wrap Next's
// commands with `dotenv -e ../../.env.local -c -- next …`, which
// injects those variables into process.env BEFORE Next.js forks its
// workers. This keeps the canonical env at the root while Next.js sees
// it the way it expects.
//
// Boot-time validation lives in `src/instrumentation.ts`, which runs
// once on server startup after all env files are merged.

/**
 * Next.js configuration.
 *
 * Security-first defaults:
 * - `poweredByHeader: false`: never leak framework identity.
 * - `output: "standalone"`: self-contained build for Docker.
 * - `experimental.typedRoutes`: catches broken links at build time.
 *
 * Additional security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc.)
 * are applied in middleware at runtime — see PR #6 (apps/web/src/middleware.ts).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  transpilePackages: [
    "@startup-boilerplate/api-client",
    "@startup-boilerplate/auth",
    "@startup-boilerplate/cms",
    "@startup-boilerplate/config",
    "@startup-boilerplate/db",
    "@startup-boilerplate/env",
    "@startup-boilerplate/logger",
    "@startup-boilerplate/ui",
  ],
};

export default nextConfig;
