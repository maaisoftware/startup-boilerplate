import { NextResponse, type NextRequest } from "next/server";

import { rateLimit, sweepExpired } from "./lib/rate-limit.ts";

/**
 * Next.js middleware — runs on every request before the route handler.
 *
 * Responsibilities:
 *   - Attach security headers (CSP, HSTS, X-Frame-Options, etc.).
 *   - Rate-limit per-IP. Read-heavy routes get a generous bucket; API
 *     writes are tighter.
 *
 * CSRF verification is done by each POST/PATCH/DELETE route via the
 * api-handler wrapper rather than in middleware — middleware cannot
 * easily share secrets with `getServerEnv()` on the edge runtime.
 */

const PROD = process.env.NODE_ENV === "production";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co http://127.0.0.1:*",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Remove unsafe-inline/unsafe-eval in production. Dev needs them for
// Next.js + React Fast Refresh. The production CSP is stricter.
const PROD_CSP_DIRECTIVES = CSP_DIRECTIVES.replace(
  "'unsafe-inline' 'unsafe-eval'",
  "",
);

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    PROD ? PROD_CSP_DIRECTIVES : CSP_DIRECTIVES,
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (PROD) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  return response;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isMutating(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Periodic sweep to keep the in-memory rate-limit store bounded.
  if (Math.random() < 0.01) sweepExpired();

  if (pathname.startsWith("/api/")) {
    const ip = clientIp(request);
    const mutating = isMutating(request.method);
    const budget = mutating
      ? { limit: 10, windowMs: 60_000 }
      : { limit: 60, windowMs: 60_000 };
    const key = `${mutating ? "w" : "r"}:${ip}:${pathname}`;
    const verdict = rateLimit(key, budget);
    if (!verdict.success) {
      const response = NextResponse.json(
        { code: "rate_limit.exceeded", message: "Too many requests." },
        { status: 429 },
      );
      response.headers.set(
        "Retry-After",
        Math.ceil((verdict.resetAt - Date.now()) / 1000).toString(),
      );
      response.headers.set("X-RateLimit-Limit", verdict.limit.toString());
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", verdict.resetAt.toString());
      return addSecurityHeaders(response);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  // Skip middleware on static assets and the Next.js internal routes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
