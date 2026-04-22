import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import {
  PermissionDeniedError,
  UnauthorizedError,
} from "@startup-boilerplate/auth";
import { getLogger } from "@startup-boilerplate/logger";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, verifyCsrfToken } from "./csrf.ts";

/**
 * Thin wrapper for App-Router route handlers.
 *
 * Responsibilities:
 *   - Optionally verify CSRF token (header must equal cookie + valid HMAC).
 *   - Parse the JSON body against a Zod schema (if supplied).
 *   - Map thrown errors to consistent JSON responses.
 *   - Never leak upstream errors: upstream messages are logged server-side
 *     but rewritten to a generic shape for the client.
 *
 * Example:
 *
 *   export const POST = apiHandler({
 *     input: createPostSchema,
 *     requireCsrf: true,
 *     handler: async ({ input, request }) => { ... },
 *   });
 */

export interface ApiContext<TInput> {
  input: TInput;
  request: Request;
}

export interface ApiHandlerOptions<TInput, TOutput> {
  /** Optional Zod schema for the JSON body. */
  input?: ZodType<TInput>;
  /**
   * When true, the handler returns 403 unless the request carries a valid
   * `x-csrf-token` header whose value matches the `sb_csrf` cookie AND
   * passes HMAC verification. Default: false. Turn on for every state-
   * changing route (POST/PATCH/DELETE).
   */
  requireCsrf?: boolean;
  /** Handler function returning a JSON-serialisable value. */
  handler: (ctx: ApiContext<TInput>) => Promise<TOutput>;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** Extract a single cookie value by name from a `Cookie` header. */
function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.split("=");
    if ((rawKey ?? "").trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

async function enforceCsrf(request: Request): Promise<NextResponse | null> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = readCookie(
    request.headers.get("cookie"),
    CSRF_COOKIE_NAME,
  );
  if (!headerToken || !cookieToken) {
    return errorResponse(403, "csrf.missing", "Missing CSRF token.");
  }
  if (headerToken !== cookieToken) {
    // Double-submit mismatch: cross-origin attacker can't read the cookie
    // to forge a matching header.
    return errorResponse(403, "csrf.mismatch", "CSRF token mismatch.");
  }
  const verdict = await verifyCsrfToken(headerToken);
  if (!verdict.valid) {
    return errorResponse(
      403,
      `csrf.${verdict.reason ?? "invalid"}`,
      "Invalid CSRF token.",
    );
  }
  return null;
}

export function apiHandler<TInput = undefined, TOutput = unknown>(
  options: ApiHandlerOptions<TInput, TOutput>,
): (request: Request) => Promise<NextResponse> {
  return async function handler(request: Request): Promise<NextResponse> {
    const log = await getLogger();

    if (options.requireCsrf === true) {
      const csrfError = await enforceCsrf(request);
      if (csrfError) return csrfError;
    }

    let input: TInput = undefined as TInput;

    if (options.input !== undefined) {
      const body = (await request.json().catch(() => undefined)) as unknown;
      const parsed = options.input.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          400,
          "validation.failed",
          "Request body failed validation.",
          parsed.error.issues,
        );
      }
      input = parsed.data;
    }

    try {
      const result = await options.handler({ input, request });
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return errorResponse(
          401,
          "auth.unauthorized",
          "Authentication required.",
        );
      }
      if (error instanceof PermissionDeniedError) {
        return errorResponse(403, "auth.forbidden", "Permission denied.");
      }
      if (error instanceof ZodError) {
        return errorResponse(
          400,
          "validation.failed",
          "Response shape failed server-side validation.",
          error.issues,
        );
      }
      log.error(error instanceof Error ? error : new Error(String(error)), {
        scope: "api.unhandled",
        url: request.url,
        method: request.method,
      });
      // Rewrite upstream details — never leak to the client.
      return errorResponse(500, "api.internal_error", "Internal server error.");
    }
  };
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  const body: ApiErrorBody = {
    code,
    message,
    ...(details === undefined ? {} : { details }),
  };
  return NextResponse.json(body, { status });
}
