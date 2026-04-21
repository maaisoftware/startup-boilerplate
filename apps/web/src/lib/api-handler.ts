import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import {
  PermissionDeniedError,
  UnauthorizedError,
} from "@startup-boilerplate/auth";
import { getLogger } from "@startup-boilerplate/logger";

/**
 * Thin wrapper for App-Router route handlers.
 *
 * Responsibilities:
 *   - Parse the JSON body against a Zod schema (if supplied).
 *   - Map thrown errors to consistent JSON responses.
 *   - Never leak upstream errors: upstream messages are logged server-side
 *     but rewritten to a generic shape for the client.
 *
 * Example:
 *
 *   export const POST = apiHandler({
 *     input: createPostSchema,
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
  /** Handler function returning a JSON-serialisable value. */
  handler: (ctx: ApiContext<TInput>) => Promise<TOutput>;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export function apiHandler<TInput = undefined, TOutput = unknown>(
  options: ApiHandlerOptions<TInput, TOutput>,
): (request: Request) => Promise<NextResponse> {
  return async function handler(request: Request): Promise<NextResponse> {
    const log = await getLogger();
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
