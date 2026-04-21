import type { ReactNode } from "react";

import { JsonLd } from "./json-ld.tsx";

/**
 * PageShell is the contract for every user-facing page. TypeScript
 * requires every required prop, so a missing title/description is a
 * compile error — the canonical enforcement that pairs with the
 * runtime SEO audit in Playwright.
 *
 * Pages still export `generateMetadata` in their route file (Next.js
 * can only read metadata from route exports, not from component
 * props), but PageShell asserts the visible headline + structured
 * data match what metadata advertises.
 */
export interface PageShellProps {
  /** Visible title of the page. Usually <h1>-rendered. */
  title: string;
  /** Short description, usually shown under the title. */
  description: string;
  /**
   * Schema.org JSON-LD payload. Pages that represent an Article,
   * Product, or Organization pass the full schema here; navigation-
   * only pages pass a BreadcrumbList or similar.
   */
  structuredData: Record<string, unknown>;
  /** Optional nonce for the JSON-LD script (strict CSP). */
  nonce?: string;
  /** Page content. */
  children: ReactNode;
}

export function PageShell({
  title,
  description,
  structuredData,
  nonce,
  children,
}: PageShellProps) {
  return (
    <>
      <JsonLd data={structuredData} {...(nonce ? { nonce } : {})} />
      <header className="mx-auto max-w-3xl px-6 pt-24">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-neutral-400">{description}</p>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </>
  );
}
