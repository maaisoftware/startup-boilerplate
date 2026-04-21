import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Startup Boilerplate — a production-grade, AI-ready monorepo template. This scaffold boots. Real demo routes land in PR #10.",
};

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
        v0.1.0 · scaffold
      </p>
      <h1 className="text-5xl font-semibold tracking-tight">
        Startup Boilerplate
      </h1>
      <p className="max-w-xl text-lg text-neutral-300">
        Production-grade, AI-ready monorepo template for rapidly bootstrapping
        new client projects with consistent architecture, security, and
        tooling.
      </p>
      <p className="text-sm text-neutral-500">
        This page is the scaffold placeholder. Full demo routes (blog, auth,
        admin) arrive in PR #10.
      </p>
      <div className="mt-4 flex gap-4 text-sm">
        <a
          href="https://github.com/maaisoftware/startup-boilerplate"
          className="rounded-md border border-neutral-700 px-4 py-2 text-neutral-200 transition hover:border-neutral-500"
        >
          GitHub →
        </a>
        <a
          href="/api/health"
          className="rounded-md border border-neutral-700 px-4 py-2 text-neutral-200 transition hover:border-neutral-500"
        >
          Health check
        </a>
      </div>
    </main>
  );
}
