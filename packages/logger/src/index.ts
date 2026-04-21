/**
 * Public entry point for the logger abstraction.
 *
 *   import { getLogger, type Logger } from "@startup-boilerplate/logger";
 *
 *   const log = await getLogger();
 *   log.info("request.start", { route: "/api/health" });
 *
 * Adapters are implementation details — always program against the
 * exported `Logger` interface.
 */

export { ConsoleLogger } from "./adapters/console.ts";
export { SentryLogger, type SentryClient } from "./adapters/sentry.ts";
export { getLogger } from "./factory.ts";
export {
  LOG_LEVELS,
  type LogContext,
  type Logger,
  type LoggerOptions,
  type LogLevel,
} from "./interfaces.ts";
export { isLogLevel, shouldEmit } from "./levels.ts";
