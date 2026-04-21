import { z, type ZodType } from "zod";

/**
 * Typed fetch wrapper for the browser. Enforces the invariant that every
 * outbound call from the client hits `/api/*` — never an upstream service
 * directly. The runtime validator makes the response shape explicit at
 * the call site, so a schema drift surfaces as a parse error rather than
 * silently broken UI.
 *
 * Usage:
 *
 *   const result = await apiFetch(
 *     "/api/posts",
 *     z.object({ items: z.array(postSchema) }),
 *   );
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** JSON body. Automatically stringified and given the right Content-Type. */
  json?: unknown;
  /** CSRF token for state-changing requests. Set on every non-GET call. */
  csrfToken?: string;
}

export async function apiFetch<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  if (!path.startsWith("/api/")) {
    throw new ApiError(
      0,
      "client.invalid_path",
      `apiFetch path must start with /api/: ${path}`,
    );
  }

  const { json, csrfToken, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  if (json !== undefined) {
    finalHeaders.set("content-type", "application/json");
  }
  if (csrfToken !== undefined) {
    finalHeaders.set("x-csrf-token", csrfToken);
  }

  const init: RequestInit = {
    ...rest,
    headers: finalHeaders,
    credentials: "same-origin",
  };
  if (json !== undefined) init.body = JSON.stringify(json);
  const response = await fetch(path, init);

  const raw: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const body = raw as
      | { code?: string; message?: string; details?: unknown }
      | undefined;
    throw new ApiError(
      response.status,
      body?.code ?? "api.error",
      body?.message ?? response.statusText,
      body?.details,
    );
  }

  return schema.parse(raw);
}

/** Small helper for routes that return just `{ ok: true }`. */
export const okSchema = z.object({ ok: z.literal(true) });
