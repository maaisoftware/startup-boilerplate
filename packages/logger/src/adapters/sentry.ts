import type {
  LogContext,
  Logger,
  LogLevel,
  LoggerOptions,
} from "../interfaces.ts";
import { shouldEmit } from "../levels.ts";

/**
 * Sentry adapter. Sends records to Sentry via @sentry/nextjs. `debug`
 * and `info` become breadcrumbs; `warn` and `error` become captured
 * messages or exceptions.
 *
 * Dynamic import of @sentry/nextjs keeps this package usable on the
 * client without pulling the full Sentry browser bundle when the
 * console adapter is selected. When SENTRY_DSN is missing, this
 * adapter silently falls back to no-op behaviour.
 */

/**
 * Minimal shape of the Sentry API this adapter needs. Typing it
 * explicitly means the @sentry/nextjs dep can be absent at test time
 * without TypeScript losing the signature.
 */
export interface SentryClient {
  init?: (options: { dsn?: string; enabled?: boolean }) => void;
  captureException: (error: unknown, hint?: { extra?: LogContext }) => string;
  captureMessage: (
    message: string,
    hint?: {
      level?: "debug" | "info" | "warning" | "error" | "fatal";
      extra?: LogContext;
    },
  ) => string;
  addBreadcrumb: (breadcrumb: {
    category?: string;
    level?: "debug" | "info" | "warning" | "error";
    message?: string;
    data?: LogContext;
  }) => void;
  flush: (timeoutMs?: number) => Promise<boolean>;
}

export interface SentryLoggerOptions extends LoggerOptions {
  /** Injected for tests; in prod the factory passes the real @sentry/nextjs. */
  client: SentryClient;
}

const sentryLevelFor = (
  level: LogLevel,
): "debug" | "info" | "warning" | "error" =>
  level === "warn" ? "warning" : level === "silent" ? "info" : level;

export class SentryLogger implements Logger {
  private level: LogLevel;
  private readonly context: LogContext;
  private readonly client: SentryClient;

  constructor(options: SentryLoggerOptions) {
    this.level = options.level ?? "info";
    this.context = options.context ?? {};
    this.client = options.client;
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldEmit(level, this.level)) return;
    const extra = { ...this.context, ...(context ?? {}) };
    const sentryLevel = sentryLevelFor(level);

    try {
      if (level === "error") {
        this.client.captureMessage(message, { level: "error", extra });
        return;
      }
      if (level === "warn") {
        this.client.captureMessage(message, { level: "warning", extra });
        return;
      }
      // debug/info -> breadcrumb
      this.client.addBreadcrumb({
        category: "log",
        level: sentryLevel,
        message,
        data: extra,
      });
    } catch {
      // Logging must never throw.
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(messageOrError: Error | string, context?: LogContext): void {
    if (!shouldEmit("error", this.level)) return;
    const extra = { ...this.context, ...(context ?? {}) };
    try {
      if (messageOrError instanceof Error) {
        this.client.captureException(messageOrError, { extra });
        return;
      }
      this.client.captureMessage(messageOrError, { level: "error", extra });
    } catch {
      // Logging must never throw.
    }
  }

  child(context: LogContext): Logger {
    return new SentryLogger({
      level: this.level,
      context: { ...this.context, ...context },
      client: this.client,
    });
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
  getLevel(): LogLevel {
    return this.level;
  }

  async flush(): Promise<void> {
    try {
      await this.client.flush(2000);
    } catch {
      // best-effort
    }
  }
}
