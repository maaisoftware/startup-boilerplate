/**
 * In-memory token-bucket rate limiter. Zero external dependencies, fine
 * for single-instance local dev and small self-hosted deploys. For
 * multi-instance production, swap in the Upstash-backed adapter (TBD).
 *
 * The limiter is keyed by identifier (usually the client IP). Each key
 * holds an expiry timestamp and a counter. When the window elapses, the
 * counter resets.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Number of requests allowed per window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

const buckets = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || existing.expiresAt <= now) {
    const expiresAt = now + options.windowMs;
    buckets.set(identifier, { count: 1, expiresAt });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetAt: expiresAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetAt: existing.expiresAt,
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - existing.count,
    resetAt: existing.expiresAt,
  };
}

/**
 * Best-effort cleanup of expired entries. Called lazily from the Proxy
 * layer so we don't need a timer — memory stays bounded under sustained load.
 */
export function sweepExpired(now: number = Date.now()): number {
  let removed = 0;
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
      removed += 1;
    }
  }
  return removed;
}

/** Test-only: reset the shared map. */
export function __resetRateLimitForTests(): void {
  buckets.clear();
}
