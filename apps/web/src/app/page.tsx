import type { Metadata } from "next";
import Link from "next/link";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getServerEnv } from "@startup-boilerplate/env/server";
import { JsonLd, organizationSchema } from "@startup-boilerplate/ui";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Local development dashboard for the Startup Boilerplate template. Every wired service, every demo route, the step-by-step feature flow.",
};

/**
 * Home page renders as a server component so the provider status
 * reflects the live env at page load. Swap `LOGGER_PROVIDER=sentry`
 * in `.env.local`, restart `pnpm dev`, and the Active providers
 * section updates on the next request.
 */
export default function HomePage() {
  const clientEnv = getClientEnv();
  const serverEnv = getServerEnv();

  const appOrigin = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const supabaseUrl = new URL(clientEnv.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseHost = `${supabaseUrl.protocol}//${supabaseUrl.hostname}`;
  const webPort = appPort(appOrigin);

  const services: ServiceCard[] = [
    {
      name: "App home",
      url: `${appOrigin}/`,
      port: webPort,
      description: "This page. Server-rendered.",
      kind: "app",
    },
    {
      name: "API health",
      url: `${appOrigin}/api/health`,
      port: webPort,
      description: "Liveness probe → JSON status/name/env/version/timestamp.",
      kind: "app",
    },
    {
      name: "Blog index",
      url: `${appOrigin}/blog`,
      port: webPort,
      description: "Lists published posts from the CMS abstraction.",
      kind: "app",
    },
    {
      name: "Seeded post",
      url: `${appOrigin}/blog/hello-world`,
      port: webPort,
      description: "Article JSON-LD, generateMetadata, PageShell.",
      kind: "app",
    },
    {
      name: "sitemap.xml",
      url: `${appOrigin}/sitemap.xml`,
      port: webPort,
      description: "Dynamic sitemap from the CMS adapter.",
      kind: "seo",
    },
    {
      name: "robots.txt",
      url: `${appOrigin}/robots.txt`,
      port: webPort,
      description: "Allow-all with sitemap pointer.",
      kind: "seo",
    },
    {
      name: "llms.txt",
      url: `${appOrigin}/llms.txt`,
      port: webPort,
      description: "Primary paths for LLM crawlers.",
      kind: "seo",
    },
    {
      name: "Supabase API (PostgREST + Auth)",
      url: `${supabaseHost}:54421`,
      port: 54421,
      description:
        "Public Supabase endpoint — ports shifted +100 from defaults.",
      kind: "infra",
    },
    {
      name: "Supabase Studio",
      url: `${supabaseHost}:54423`,
      port: 54423,
      description: "DB dashboard — browse tables, run SQL, view RLS policies.",
      kind: "infra",
    },
    {
      name: "Inbucket (mail)",
      url: `${supabaseHost}:54424`,
      port: 54424,
      description:
        "Captured auth emails during local dev. No mail leaves the machine.",
      kind: "infra",
    },
  ];

  const providers: ProviderCard[] = [
    {
      name: "Logger",
      envKey: "LOGGER_PROVIDER",
      current: serverEnv.LOGGER_PROVIDER,
      options: ["console", "sentry"],
      activateNote: "Set SENTRY_DSN + LOGGER_PROVIDER=sentry.",
    },
    {
      name: "Analytics",
      envKey: "ANALYTICS_PROVIDER",
      current: serverEnv.ANALYTICS_PROVIDER,
      options: ["noop", "posthog"],
      activateNote: "Set POSTHOG_API_KEY + ANALYTICS_PROVIDER=posthog.",
    },
    {
      name: "Feature flags",
      envKey: "FEATURE_FLAGS_PROVIDER",
      current: serverEnv.FEATURE_FLAGS_PROVIDER,
      options: ["env", "posthog"],
      activateNote: "Env-based uses FEATURE_* vars directly.",
    },
    {
      name: "Payments",
      envKey: "PAYMENTS_PROVIDER",
      current: serverEnv.PAYMENTS_PROVIDER,
      options: ["noop", "stripe"],
      activateNote: "Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.",
    },
    {
      name: "Automations",
      envKey: "AUTOMATIONS_PROVIDER",
      current: serverEnv.AUTOMATIONS_PROVIDER,
      options: ["noop", "n8n"],
      activateNote: "Set N8N_WEBHOOK_URL + N8N_WEBHOOK_SECRET.",
    },
    {
      name: "CMS",
      envKey: "CMS_PROVIDER",
      current: serverEnv.CMS_PROVIDER,
      options: ["builtin"],
      activateNote:
        "Built-in Supabase adapter. Alternatives slot in via ADR 0002.",
    },
    {
      name: "Docs engine",
      envKey: "DOCS_ENGINE_PROVIDER",
      current: serverEnv.DOCS_ENGINE_PROVIDER,
      options: ["vault"],
      activateNote: "Local vault reads from knowledge/*.md.",
    },
    {
      name: "Rate limiter",
      envKey: "RATE_LIMIT_PROVIDER",
      current: serverEnv.RATE_LIMIT_PROVIDER,
      options: ["memory", "upstash"],
      activateNote: "Memory is single-instance. Upstash needs URL + token.",
    },
  ];

  return (
    <>
      <JsonLd
        data={organizationSchema({
          name: clientEnv.NEXT_PUBLIC_APP_NAME,
          url: appOrigin,
        })}
      />

      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
            v0.1.0 · {serverEnv.NODE_ENV} · local dashboard
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            {clientEnv.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-300">
            This is the local dev dashboard. Every wired service + demo route is
            one click away, the active adapter for each abstraction is shown
            inline, and the &ldquo;add a feature&rdquo; walkthrough below is the
            canonical flow every contributor follows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <LinkChip
              href="https://github.com/maaisoftware/startup-boilerplate"
              label="GitHub ↗"
              external
            />
            <LinkChip
              href={`${appOrigin}/api/health`}
              label="Health JSON ↗"
              external
            />
            <LinkChip href={`${appOrigin}/blog`} label="Blog demo" />
            <LinkChip href="#add-feature" label="Add a feature ↓" />
          </div>
        </header>

        <Section
          id="services"
          title="Services running locally"
          subtitle="Open any of these in a new tab to confirm the wiring."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <ServiceCardView key={service.url} service={service} />
            ))}
          </div>
        </Section>

        <Section
          id="providers"
          title="Active providers"
          subtitle="Flipping a provider is an env-var change. Defaults run with zero external services."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {providers.map((provider) => (
              <ProviderCardView key={provider.envKey} provider={provider} />
            ))}
          </div>
        </Section>

        <Section
          id="add-feature"
          title="Add a feature — step by step"
          subtitle="The template enforces this shape. Skip a step and CI will catch you; follow it and everything slots into place."
        >
          <ol className="space-y-4 text-neutral-200">
            {WALKTHROUGH.map((step, index) => (
              <li
                key={step.title}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                </div>
                <p className="mt-2 text-neutral-400">{step.description}</p>
                {step.command !== undefined && (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-black/60 p-3 font-mono text-xs text-neutral-200">
                    {step.command}
                  </pre>
                )}
                {step.files !== undefined && (
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                    {step.files.map((file) => (
                      <li
                        key={file}
                        className="rounded border border-neutral-700 px-2 py-0.5 font-mono text-neutral-300"
                      >
                        {file}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="shortcuts"
          title="Daily shortcuts"
          subtitle="Every command runs from the repo root."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.command}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4"
              >
                <pre className="overflow-x-auto font-mono text-sm text-neutral-200">
                  {shortcut.command}
                </pre>
                <p className="mt-1 text-xs text-neutral-500">
                  {shortcut.description}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="next"
          title="Pending polish"
          subtitle="Not blockers for building, but next on the list."
        >
          <ul className="space-y-2 text-neutral-300">
            {PENDING.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-neutral-600">◦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          Root rules:{" "}
          <Link
            href="https://github.com/maaisoftware/startup-boilerplate/blob/main/CLAUDE.md"
            className="underline hover:text-neutral-300"
          >
            CLAUDE.md
          </Link>
          {" · "}
          <Link
            href="https://github.com/maaisoftware/startup-boilerplate/blob/main/CONTRIBUTING.md"
            className="underline hover:text-neutral-300"
          >
            CONTRIBUTING.md
          </Link>
          {" · "}
          <Link
            href="https://github.com/maaisoftware/startup-boilerplate/tree/main/knowledge/decisions"
            className="underline hover:text-neutral-300"
          >
            ADRs
          </Link>
          {" · "}
          <Link
            href="https://github.com/maaisoftware/startup-boilerplate/blob/main/CHANGELOG.md"
            className="underline hover:text-neutral-300"
          >
            Changelog
          </Link>
        </footer>
      </div>
    </>
  );
}

// ─── UI bits ─────────────────────────────────────────────────────────────────

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function LinkChip({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "rounded-md border border-neutral-700 px-4 py-2 text-neutral-200 transition hover:border-neutral-500";
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }
  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

function ServiceCardView({ service }: { service: ServiceCard }) {
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-emerald-700/50 hover:bg-neutral-900/70"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-neutral-100 group-hover:text-emerald-300">
          {service.name}
        </span>
        <KindBadge kind={service.kind} />
      </div>
      <p className="mt-1 text-xs text-neutral-500">{service.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <code className="truncate font-mono text-neutral-400">
          {service.url}
        </code>
        <span className="ml-2 font-mono text-neutral-500">:{service.port}</span>
      </div>
    </a>
  );
}

function ProviderCardView({ provider }: { provider: ProviderCard }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-neutral-100">{provider.name}</span>
        <code className="font-mono text-xs text-emerald-400">
          {provider.current}
        </code>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {provider.options.map((option) => (
          <span
            key={option}
            className={
              option === provider.current
                ? "rounded border border-emerald-700/60 bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-300"
                : "rounded border border-neutral-700 px-2 py-0.5 text-xs text-neutral-500"
            }
          >
            {option}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        <code className="font-mono text-neutral-400">{provider.envKey}</code> ·{" "}
        {provider.activateNote}
      </p>
    </div>
  );
}

function KindBadge({ kind }: { kind: ServiceKind }) {
  const styles: Record<ServiceKind, string> = {
    app: "border-sky-800 bg-sky-900/40 text-sky-300",
    seo: "border-amber-800 bg-amber-900/30 text-amber-300",
    infra: "border-purple-800 bg-purple-900/30 text-purple-300",
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${styles[kind]}`}
    >
      {kind}
    </span>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

type ServiceKind = "app" | "seo" | "infra";

interface ServiceCard {
  name: string;
  url: string;
  port: number;
  description: string;
  kind: ServiceKind;
}

interface ProviderCard {
  name: string;
  envKey: string;
  current: string;
  options: readonly string[];
  activateNote: string;
}

function appPort(origin: string): number {
  try {
    const parsed = new URL(origin);
    if (parsed.port) return Number(parsed.port);
    return parsed.protocol === "https:" ? 443 : 80;
  } catch {
    return 3000;
  }
}

interface WalkthroughStep {
  title: string;
  description: string;
  command?: string;
  files?: string[];
}

const WALKTHROUGH: WalkthroughStep[] = [
  {
    title: "Declare the permission in RBAC",
    description:
      "Open the policy DSL and extend RESOURCES + POLICY with the new resource and its per-action roles. This is the single source of truth — the API guards and (eventually) RLS policies both read from it.",
    files: ["packages/auth/src/rbac.ts", "packages/auth/src/rbac.test.ts"],
  },
  {
    title: "Model the schema",
    description:
      "Create the Drizzle table in packages/db/src/schema/<name>.ts, re-export from src/schema/index.ts, then author the matching SQL migration. RLS must be enabled on every new table with at least one policy, or the coverage test will fail.",
    command: "supabase migration new add_<name>",
    files: [
      "packages/db/src/schema/<name>.ts",
      "supabase/migrations/<timestamp>_add_<name>.sql",
      "packages/db/test/integration/rls.test.ts",
    ],
  },
  {
    title: "Apply and seed",
    description:
      "Wipes the local DB, re-runs every migration in order, then applies supabase/seed.sql. Safe — nothing in local Supabase persists beyond this.",
    command: "pnpm supabase:reset",
  },
  {
    title: "Expose the read path through an abstraction",
    description:
      "If the data is CMS-shaped, add a method to the CMS interface + adapter and the shared contract suite. If it is a new concern, create a new abstraction package using the interface + adapter + factory pattern from ADR 0002.",
    files: [
      "packages/cms/src/interfaces.ts",
      "packages/cms/src/adapters/builtin-supabase.ts",
    ],
  },
  {
    title: "Ship an API route",
    description:
      "Wrap the handler with apiHandler({ input, handler }) from apps/web/src/lib/api-handler.ts. Call requireSession() + requirePermission() at the top. For mutations, call writeAudit() before returning. Upstream errors get rewritten automatically.",
    files: ["apps/web/src/app/api/<name>/route.ts"],
  },
  {
    title: "Render the page",
    description:
      "Every user-facing page goes through <PageShell>. It enforces title/description/structuredData as compile-time props and emits JSON-LD. generateMetadata in the route file is required — CI checks it.",
    files: ["apps/web/src/app/<path>/page.tsx"],
  },
  {
    title: "Call the API from the client",
    description:
      "Use apiFetch(path, zodSchema, { json, csrfToken }) from @startup-boilerplate/api-client. Never raw fetch to upstream services — the wrapper enforces /api/* paths and validates responses.",
    files: ["packages/api-client/src/index.ts"],
  },
  {
    title: "Test it",
    description:
      "Unit tests sit next to source (*.test.ts). RLS integration tests go in packages/db/test/integration/. Playwright smoke tests under apps/web/tests/e2e/ cover the happy path. Contract tests run automatically for every new adapter.",
    command:
      "pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @startup-boilerplate/web test:e2e",
  },
  {
    title: "Document it",
    description:
      "Architectural choice → new ADR in knowledge/decisions/. New feature → knowledge/features/<slug>.md. New env var → .env.example + packages/env/src/schema.ts + tests, all in the same commit. Conventional-commits format is enforced.",
    files: [
      "knowledge/decisions/<NNNN>-<slug>.md",
      "knowledge/features/<slug>.md",
      ".env.example",
    ],
  },
];

const SHORTCUTS: { command: string; description: string }[] = [
  { command: "pnpm dev", description: "Next.js dev on :3000 via Turbopack." },
  {
    command: "pnpm build && pnpm --filter @startup-boilerplate/web start",
    description: "Production build + serve.",
  },
  { command: "pnpm test", description: "Every package's Vitest suite." },
  {
    command: "pnpm test:contract",
    description: "Shared contract tests across every adapter.",
  },
  {
    command: "pnpm --filter @startup-boilerplate/web test:e2e",
    description:
      "Playwright smoke suite (needs `playwright install chromium` once).",
  },
  {
    command: "pnpm supabase:start",
    description:
      "Boots local Supabase on shifted ports 54421/54422/54423/54424.",
  },
  {
    command: "pnpm supabase:reset",
    description: "Wipes local DB, re-runs migrations, re-seeds.",
  },
  {
    command: "pnpm sync:env",
    description: "Re-sync root .env.local into apps/web/.env.local.",
  },
  {
    command: "pnpm lint && pnpm typecheck",
    description: "The two checks CI also runs.",
  },
  {
    command: "pnpm format",
    description: "Prettier across the whole monorepo.",
  },
];

const PENDING: string[] = [
  ".claude/skills/* — the add-feature, add-adapter, write-adr, sync-knowledge walkthroughs are referenced but the folders are empty.",
  "Custom ESLint rule no-page-without-metadata — TypeScript props on <PageShell> cover most of the value; the CI-level check isn't in place yet.",
  "Sign-in / sign-up demo pages + an admin create-post flow — the abstractions are ready; no UI uses the write path yet.",
  "Playwright smoke suite has never been executed in this environment — run `pnpm --filter @startup-boilerplate/web exec playwright install chromium` then `pnpm --filter @startup-boilerplate/web test:e2e`.",
  "Integration test for a mutating /api/ route (msw or local Supabase) — proves auth → RBAC → audit-log end-to-end for a mutation path.",
  "First CI run on GitHub may need env-placeholder tweaks in .github/workflows/ci.yml after the empty-string schema fix.",
];
