---
name: add-adapter
description: Walks through adding a new adapter to any abstraction layer (logger, analytics, feature-flags, payments, automations, cms, docs-engine). Invoke when a user asks to integrate Datadog, Mixpanel, LaunchDarkly, Paddle, Lemon Squeezy, Zapier, Trigger.dev, Sanity, Builder.io, Contentful, Notion, Confluence, or any similar provider that fits an existing abstraction.
---

# add-adapter

Every abstraction in this monorepo follows the interface + adapter + factory + contract pattern from ADR 0002. Adding a new adapter is mechanical — follow the checklist.

## Before starting

Confirm with the user:

1. Which abstraction? (`logger` | `analytics` | `feature-flags` | `payments` | `automations` | `cms` | `docs-engine`)
2. Which provider? (e.g. Datadog, Mixpanel, LaunchDarkly)
3. Does this provider belong behind an env var (server-only) or a client-exposed key? Most adapters are server-only.
4. Are there authentication tokens? Are they rotatable? This feeds env schema design.

If no existing abstraction fits, STOP and use the `/write-adr` skill to propose a new abstraction first. Never add a package speculatively.

## The checklist

### 1. Extend the env schema

Edit `packages/env/src/schema.ts`:

- Add a literal to the matching provider enum (e.g. `LOGGER_PROVIDER = enum(["console", "sentry", "datadog"])`).
- Add the provider's secret / config vars to `serverSchema`, usually `nonEmpty.optional()` because the adapter only runs when selected.
- Add a happy-path and a rejection test in `packages/env/src/schema.test.ts` so the schema change is protected.

Update `.env.example` with the new vars — `[OPTIONAL]` marker unless the provider is mandatory for the project.

### 2. Add to commitlint scope allow-list

If the abstraction package isn't already in `commitlint.config.cjs` `scope-enum`, add it. Rare — most abstractions are already there.

### 3. Write the adapter

Create `packages/<abstraction>/src/adapters/<provider>.ts` implementing the interface. Patterns that apply to every adapter:

- **Never throw.** Wrap every downstream SDK call in `try { ... } catch { /* silent or log via our logger */ }`. A broken backend must not break the caller's request.
- **Minimal typed client shape.** Declare a local interface describing only the methods the adapter needs. Don't import the SDK's types — they carry transitive type baggage.
- **Constructor takes the client + options.** The factory instantiates the real SDK; tests pass a mocked client matching the same shape.

Example (payments):

```ts
export interface LaunchDarklyClient {
  variation: (
    flag: string,
    user: LDUser,
    fallback: boolean,
  ) => Promise<boolean>;
  close: () => Promise<void>;
}

export class LaunchDarklyFeatureFlags implements FeatureFlags {
  constructor(private readonly client: LaunchDarklyClient) {}
  async isEnabled(key: FlagKey, ctx?: FlagContext): Promise<boolean> {
    try {
      return await this.client.variation(key, toLdUser(ctx), false);
    } catch {
      return false;
    }
  }
  // ...
}
```

### 4. Make the factory select it

Edit `packages/<abstraction>/src/factory.ts`. Add a branch:

```ts
if (env.LOGGER_PROVIDER === "datadog" && env.DATADOG_API_KEY) {
  const { Client } = await import("@datadog/node");
  const client = new Client({ apiKey: env.DATADOG_API_KEY });
  cached = new DatadogLogger({ client });
  return cached;
}
```

Dynamic `import()` is critical — it keeps the SDK out of the default-path bundle.

### 5. Export from the barrel

Add the new adapter and its client-shape interface to `packages/<abstraction>/src/index.ts` so tests and deploy-time overrides can import it by name.

### 6. Write adapter-specific tests

Create `packages/<abstraction>/src/adapters/<provider>.test.ts`:

- First line of the file: invoke the shared contract, e.g. `runLoggerContract("DatadogLogger", () => new DatadogLogger({ client: fakeClient() }))`.
- Add provider-specific tests below: SDK call payloads, error-swallowing, flush behaviour.

Target ≥95% line coverage on the adapter (enforced in `vitest.config.ts`).

### 7. Update documentation

- Edit `packages/<abstraction>/CLAUDE.md`'s "Swappable to" list and "Common tasks" section.
- If the adapter requires external setup (Datadog org ID, LaunchDarkly env key), add a section to `.github/workflows/README.md` documenting the required CI secret.
- Add a line to `CHANGELOG.md` under `[Unreleased]`.

### 8. Verify

```bash
pnpm --filter @startup-boilerplate/<abstraction> lint
pnpm --filter @startup-boilerplate/<abstraction> typecheck
pnpm --filter @startup-boilerplate/<abstraction> test:contract
pnpm --filter @startup-boilerplate/<abstraction> test
```

Every contract test must still pass against every adapter in the suite — including the new one.

## What a real swap looks like at the consumer layer

Nothing. Consumer code imports the interface via `getLogger()` / `getAnalytics()` / `getCms()`. Flipping `LOGGER_PROVIDER=datadog` in `.env.local`, restarting, and the new adapter takes over. Zero code changes in `apps/web`.

## References

- ADR 0002: abstraction layers pattern.
- Existing example adapters: `packages/logger/src/adapters/sentry.ts`, `packages/analytics/src/adapters/posthog.ts`.
- Contract suites: `packages/*/src/contract.ts`.
