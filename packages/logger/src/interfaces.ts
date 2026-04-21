/**
 * Log levels, ordered most-verbose → least-verbose.
 * `silent` exists only as a filter — it is never emitted.
 */
export const LOG_LEVELS = ["debug", "info", "warn", "error", "silent"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Arbitrary structured context attached to a log record. */
export type LogContext = Readonly<Record<string, unknown>>;

/**
 * The logger contract every adapter implements.
 *
 * Adapters MUST:
 *   - Never throw out of a log call. Loggers are best-effort; a broken
 *     logger must never break the caller's request.
 *   - Honour `setLevel()` — records below the threshold are dropped silently.
 *   - Support `child()` — returns a new Logger with additional bound context.
 *     Bound context merges into every subsequent record.
 */
export interface Logger {
  /** Emits a record at the given level. */
  log(level: LogLevel, message: string, context?: LogContext): void;

  /** Shorthand level methods. */
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;

  /**
   * Error-level record. The first argument may be an Error instance so
   * the adapter can attach stack/name alongside the message. Strings
   * are also accepted for simple failure messages.
   */
  error(messageOrError: Error | string, context?: LogContext): void;

  /** Return a new logger with additional bound context. */
  child(context: LogContext): Logger;

  /** Set the minimum log level. Records below are dropped. */
  setLevel(level: LogLevel): void;

  /** Current level. */
  getLevel(): LogLevel;

  /** Flush any buffered records. Some adapters (Sentry) batch by default. */
  flush(): Promise<void>;
}

/** Factory options — mostly for tests, which bypass the env-based factory. */
export interface LoggerOptions {
  level?: LogLevel;
  context?: LogContext;
}
