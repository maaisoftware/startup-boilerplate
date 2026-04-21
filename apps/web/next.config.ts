import type { NextConfig } from "next";

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
  transpilePackages: ["@startup-boilerplate/config"],
};

export default nextConfig;
