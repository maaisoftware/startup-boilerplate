import type {
  LogContext,
  Logger,
  LogLevel,
  LoggerOptions,
} from "../interfaces.ts";
import { shouldEmit } from "../levels.ts";

/**
 * Console adapter. Writes each record as a single structured line to
 * the matching `console.*` stream — debug/info → stdout, warn → warn
 * stream, error → error stream. Output shape is JSON-ish, meant to be
 * machine-grepped but human-readable.
 *
 * Used locally by default (LOGGER_PROVIDER=console) and as a fallback
 * when the Sentry adapter is configured without a DSN.
 */
export class ConsoleLogger implements Logger {
  private level: LogLevel;
  private readonly context: LogContext;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.context = options.context ?? {};
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldEmit(level, this.level)) return;
    const payload = {
      level,
      msg: message,
      ...this.context,
      ...(context ?? {}),
      ts: new Date().toISOString(),
    };
    const serialized = safeStringify(payload);
    const writer = pickWriter(level);
    writer(serialized);
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
    if (messageOrError instanceof Error) {
      this.log("error", messageOrError.message, {
        ...context,
        error: {
          name: messageOrError.name,
          stack: messageOrError.stack,
        },
      });
      return;
    }
    this.log("error", messageOrError, context);
  }

  child(context: LogContext): Logger {
    return new ConsoleLogger({
      level: this.level,
      context: { ...this.context, ...context },
    });
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

/** Writers are picked up lazily so tests can stub `console.*` before import. */
function pickWriter(level: LogLevel): (line: string) => void {
  switch (level) {
    case "error":
      return (line) => console.error(line);
    case "warn":
      return (line) => console.warn(line);
    case "debug":
      return (line) => console.debug(line);
    default:
      return (line) => console.info(line);
  }
}

/** JSON.stringify with circular-reference tolerance so no log call throws. */
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val !== null && typeof val === "object") {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    if (typeof val === "bigint") return val.toString();
    return val;
  });
}
