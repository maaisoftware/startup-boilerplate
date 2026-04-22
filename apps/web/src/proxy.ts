import { NextResponse, type NextRequest } from "next/server";

import { CSRF_COOKIE_NAME, generateCsrfToken } from "./lib/csrf.ts";
import { rateLimit, sweepExpired } from "./lib/rate-limit.ts";

/**
 * Next.js Proxy — runs on every request before the route handler.
 * (Replaces the legacy `middleware.ts` convention deprecated in Next 16.)
 *
 * Responsibilities:
 *   - Attach security headers (CSP, HSTS, X-Frame-Options, etc.).
 *   - Rate-limit per-IP. Read-heavy routes get a generous bucket; API
 *     writes are tighter.
 *   - Seed the `sb_csrf` double-submit cookie on first visit. The cookie
 *     is readable from JS (non-httpOnly) so the browser can echo it back
 *     in an `x-csrf-token` header on state-changing requests. apiHandler
 *     verifies the match + HMAC signature server-side.
 *
 * What this layer must NEVER do:
 *   - Auth checks. Server Actions bypass matcher exclusions, so any auth
 *     gate here would be unsafe. Auth lives in `src/lib/api-handler.ts`
 *     via requireSession() + requirePermission(), enforced per-handler.
 *   - DB or secret reads beyond typed env. Proxy can deploy to the edge
 *     and should not share globals with the app.
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

const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours, matches token TTL

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

async function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  if (request.cookies.get(CSRF_COOKIE_NAME)) return;
  const token = await generateCsrfToken();
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    // Non-httpOnly so the browser can read it and echo in the header.
    // SameSite=strict prevents cross-site requests from including it.
    httpOnly: false,
    sameSite: "strict",
    secure: PROD,
    path: "/",
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
  });
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

export async function proxy(request: NextRequest): Promise<NextResponse> {
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
      await ensureCsrfCookie(request, response);
      return addSecurityHeaders(response);
    }
  }

  const response = NextResponse.next();
  await ensureCsrfCookie(request, response);
  return addSecurityHeaders(response);
}

export const config = {
  // Skip the proxy on static assets and Next.js internal routes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
