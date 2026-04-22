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
 * - `typedRoutes`: catches broken <Link href>s at build time.
 *
 * Standalone output is OPT-IN via `BUILD_STANDALONE=true` at build time
 * (set by `infra/docker/web.Dockerfile`). Opting in produces a minimal
 * self-contained server under `.next/standalone/` suitable for Docker;
 * opting out keeps `next start` warning-free for local iteration. Both
 * outputs ship the same server behaviour — the difference is the
 * bundled filesystem layout.
 *
 * Additional security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, etc.)
 * are applied in the Proxy layer at runtime — see `apps/web/src/proxy.ts`.
 */
const standaloneOutput =
  process.env["BUILD_STANDALONE"] === "true"
    ? ({ output: "standalone" } as const)
    : ({} as const);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...standaloneOutput,
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
