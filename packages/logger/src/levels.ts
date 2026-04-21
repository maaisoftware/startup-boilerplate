import { LOG_LEVELS, type LogLevel } from "./interfaces.ts";

/** Numeric priority: lower number = more verbose. `silent` = ∞ (drops everything). */
export const levelPriority: Readonly<Record<LogLevel, number>> = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
});

/** True when `record` is at or above the current threshold. */
export function shouldEmit(record: LogLevel, threshold: LogLevel): boolean {
  return levelPriority[record] >= levelPriority[threshold];
}

/** Type guard for runtime-validated level values from env. */
export function isLogLevel(value: unknown): value is LogLevel {
  return (
    typeof value === "string" &&
    (LOG_LEVELS as readonly string[]).includes(value)
  );
}
