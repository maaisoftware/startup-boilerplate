import { getServerEnv } from "@startup-boilerplate/env/server";

import { ConsoleLogger } from "./adapters/console.ts";
import { SentryLogger, type SentryClient } from "./adapters/sentry.ts";
import type { Logger } from "./interfaces.ts";

/**
 * Lazy Sentry import: the @sentry/nextjs bundle is heavy; only load it
 * when LOGGER_PROVIDER=sentry. Keeps dev builds snappy.
 */
async function loadSentryClient(dsn: string): Promise<SentryClient> {
  const sentry = (await import("@sentry/nextjs")) as unknown as SentryClient & {
    init?: (options: { dsn?: string }) => void;
  };
  if (typeof sentry.init === "function") {
    sentry.init({ dsn });
  }
  return sentry;
}

let cached: Logger | undefined;

/**
 * Returns the configured logger singleton. First call resolves the
 * provider from env; subsequent calls return the cached instance.
 *
 * The return type is `Logger`, never a concrete adapter. Callers must
 * program against the interface.
 */
export async function getLogger(): Promise<Logger> {
  if (cached) return cached;

  const env = getServerEnv();
  const level = env.NODE_ENV === "production" ? "info" : "debug";

  if (env.LOGGER_PROVIDER === "sentry" && env.SENTRY_DSN) {
    const client = await loadSentryClient(env.SENTRY_DSN);
    cached = new SentryLogger({ client, level });
    return cached;
  }

  cached = new ConsoleLogger({ level });
  return cached;
}

/**
 * Test-only reset. Not part of the public surface (no export from
 * `./index.ts`) — imported directly by tests via subpath.
 */
export function __resetLoggerCacheForTests(): void {
  cached = undefined;
}
