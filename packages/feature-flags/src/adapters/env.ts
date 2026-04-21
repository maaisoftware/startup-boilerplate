import type { FeatureFlags, FlagContext, FlagKey } from "../interfaces.ts";

/**
 * Env-backed adapter. Each flag maps to an env var (`FEATURE_<SCREAMING_KEY>`).
 * Boolean-only — variants always resolve to `null`. This is the default
 * adapter so the app runs with no external service.
 *
 * FlagKey "stripe-checkout" -> env FEATURE_STRIPE_CHECKOUT
 * FlagKey "admin-ui"        -> env FEATURE_ADMIN_UI
 */

const flagEnvKey = (key: FlagKey): string =>
  `FEATURE_${key.replace(/-/g, "_").toUpperCase()}`;

export interface EnvFeatureFlagsOptions {
  /** Source of flag values. Defaults to process.env. Boolean-typed if validated by env schema. */
  source?: Readonly<Record<string, unknown>>;
}

export class EnvFeatureFlags implements FeatureFlags {
  private readonly source: Readonly<Record<string, unknown>>;

  constructor(options: EnvFeatureFlagsOptions = {}) {
    this.source = options.source ?? process.env;
  }

  isEnabled(key: FlagKey, _context?: FlagContext): boolean {
    const raw = this.source[flagEnvKey(key)];
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") return raw === "true";
    return false;
  }

  getVariant(_key: FlagKey, _context?: FlagContext): string | null {
    // Env adapter does not support multivariate flags.
    return null;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
