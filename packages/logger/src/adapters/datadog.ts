import type {
  LogContext,
  Logger,
  LogLevel,
  LoggerOptions,
} from "../interfaces.ts";
import { shouldEmit } from "../levels.ts";

/**
 * Minimal subset of the Datadog Logs HTTP intake that this adapter needs.
 * The factory provides a concrete implementation backed by `fetch` so
 * this package doesn't take a runtime dep on `@datadog/datadog-api-client`.
 * Tests provide a mocked DatadogClient.
 */
export interface DatadogClient {
  submitLog: (log: DatadogLogEntry) => Promise<void>;
  flush: () => Promise<void>;
}

export type DatadogStatus = "debug" | "info" | "warn" | "error";

export interface DatadogLogEntry {
  message: string;
  status: DatadogStatus;
  /** Custom tags, comma-separated "env:prod,service:web". */
  ddtags?: string;
  /** Free-form structured context that Datadog indexes as facets. */
  [key: string]: unknown;
}

export interface DatadogLoggerOptions extends LoggerOptions {
  client: DatadogClient;
  /** Attached to every record under the `service` facet. */
  service?: string;
  /** Deployment env ("production", "staging"), surfaces as `env:` tag. */
  env?: string;
}

function mapLevel(level: LogLevel): DatadogStatus {
  if (level === "warn") return "warn";
  if (level === "error") return "error";
  if (level === "debug") return "debug";
  return "info"; // silent has no representation — call site filters before we get here
}

export class DatadogLogger implements Logger {
  private level: LogLevel;
  private readonly context: LogContext;
  private readonly client: DatadogClient;
  private readonly service: string | undefined;
  private readonly env: string | undefined;

  constructor(options: DatadogLoggerOptions) {
    this.level = options.level ?? "info";
    this.context = options.context ?? {};
    this.client = options.client;
    this.service = options.service;
    this.env = options.env;
  }

  private submit(level: LogLevel, message: string, context?: LogContext): void {
    if (!shouldEmit(level, this.level)) return;
    const tags = [
      this.service ? `service:${this.service}` : undefined,
      this.env ? `env:${this.env}` : undefined,
    ]
      .filter(Boolean)
      .join(",");
    const entry: DatadogLogEntry = {
      message,
      status: mapLevel(level),
      ...this.context,
      ...(context ?? {}),
      ...(tags.length > 0 ? { ddtags: tags } : {}),
    };
    // Fire-and-forget; never await inside a log call.
    void this.client.submitLog(entry).catch(() => {
      // Datadog outage must not break the caller. Failures are silent by
      // design — callers that need delivery guarantees use a different
      // mechanism (queue + retry at deploy time).
    });
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.submit(level, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.submit("debug", message, context);
  }
  info(message: string, context?: LogContext): void {
    this.submit("info", message, context);
  }
  warn(message: string, context?: LogContext): void {
    this.submit("warn", message, context);
  }

  error(messageOrError: Error | string, context?: LogContext): void {
    if (messageOrError instanceof Error) {
      this.submit("error", messageOrError.message, {
        ...context,
        error: {
          name: messageOrError.name,
          stack: messageOrError.stack,
        },
      });
      return;
    }
    this.submit("error", messageOrError, context);
  }

  child(context: LogContext): Logger {
    return new DatadogLogger({
      client: this.client,
      level: this.level,
      context: { ...this.context, ...context },
      ...(this.service !== undefined ? { service: this.service } : {}),
      ...(this.env !== undefined ? { env: this.env } : {}),
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
      await this.client.flush();
    } catch {
      // best-effort
    }
  }
}

/** Factory helper: build a fetch-based client against the DD Logs intake. */
export interface FetchDatadogClientOptions {
  apiKey: string;
  /** e.g. "datadoghq.com", "datadoghq.eu", "us3.datadoghq.com". */
  site?: string;
  fetcher?: typeof fetch;
}

export function createFetchDatadogClient(
  options: FetchDatadogClientOptions,
): DatadogClient {
  const site = options.site ?? "datadoghq.com";
  const endpoint = `https://http-intake.logs.${site}/api/v2/logs`;
  const fetcher = options.fetcher ?? fetch;
  return {
    async submitLog(entry) {
      await fetcher(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "dd-api-key": options.apiKey,
        },
        body: JSON.stringify([entry]),
      });
    },
    flush() {
      // Fetch-based intake has no batching layer to flush.
      return Promise.resolve();
    },
  };
}
