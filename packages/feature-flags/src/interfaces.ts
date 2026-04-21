/** Flag identifiers used throughout the app. Add new flags here first, then update adapters. */
export type FlagKey =
  | "stripe-checkout"
  | "newsletter"
  | "comments"
  | "audit-log-viewer"
  | "admin-ui";

/** Evaluation context — user identity and any traits an adapter might need. */
export interface FlagContext {
  distinctId?: string;
  traits?: Readonly<Record<string, unknown>>;
}

/**
 * The feature-flag contract every adapter implements.
 *
 * Adapters MUST:
 *   - Never throw. Return the supplied default / `false` on lookup failure.
 *   - Be safe to call on every request. Caching, if any, is the adapter's
 *     concern — callers treat every call as cheap.
 *   - Release resources (timers, connections) on `close()`.
 */
export interface FeatureFlags {
  /** Binary flag lookup. Returns `false` on unknown keys / failures. */
  isEnabled(key: FlagKey, context?: FlagContext): Promise<boolean> | boolean;

  /** Return the assigned variant label, or null. */
  getVariant(
    key: FlagKey,
    context?: FlagContext,
  ): Promise<string | null> | string | null;

  /** Release resources on shutdown. */
  close(): Promise<void>;
}
