/** Stable identifier for a user or an anonymous device. */
export type DistinctId = string;

/** Structured properties carried alongside an event. */
export type EventProperties = Readonly<Record<string, unknown>>;

/** Traits attached to a user in `identify`. */
export type UserTraits = Readonly<Record<string, unknown>>;

/**
 * The analytics contract every adapter implements.
 *
 * Adapters MUST:
 *   - Never throw out of a capture/identify call. Analytics are best-effort.
 *   - Debounce network writes where possible. A single request handler that
 *     calls `capture` N times should never fan out to N HTTP requests.
 *   - Flush pending records when `flush()` is awaited.
 *   - Release resources (timers, open connections) on `close()`.
 */
export interface Analytics {
  /** Emit an event for the given user / device. */
  capture(event: CaptureInput): void;

  /** Attach traits to a user. Call once per session or whenever traits change. */
  identify(distinctId: DistinctId, traits?: UserTraits): void;

  /** Clear the current user's session. Call on sign-out. */
  reset(): void;

  /** Flush any buffered records. Awaits completion. */
  flush(): Promise<void>;

  /** Release timers and connections. Called on graceful shutdown. */
  close(): Promise<void>;
}

export interface CaptureInput {
  event: string;
  distinctId: DistinctId;
  properties?: EventProperties;
}
