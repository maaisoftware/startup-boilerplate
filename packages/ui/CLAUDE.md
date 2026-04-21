# `packages/ui` — Unstyled primitives + SEO components

## Purpose

Headless Tailwind-stylable primitives (`Button`) and the two SEO components every route in `apps/web` uses: `PageShell` and `JsonLd`. Consumers theme by passing class names — the package ships with sensible defaults but zero brand opinions.

## Entry points

- `src/primitives/button.tsx` — Button with variants (primary/secondary/ghost/destructive) and sizes (sm/md/lg). Defaults `type="button"` to avoid accidental form submits.
- `src/seo/page-shell.tsx` — `PageShell`. Requires title/description/structuredData as compile-time props.
- `src/seo/json-ld.tsx` — `JsonLd` component + convenience builders `articleSchema`, `organizationSchema`, `breadcrumbSchema`.
- `src/utils/cn.ts` — `cn()` class merger using clsx + tailwind-merge.

## Architectural rules

1. **Every component is a server component by default.** Client-only primitives opt in with `"use client"` at the top of the file (none currently do).
2. **TypeScript props are the contract.** `PageShellProps` requires title/description/structuredData — a page missing any is a compile error. The Playwright audit in PR #10 is a runtime belt-and-braces.
3. **`JsonLd` escapes `<`** in serialised payloads. Never interpolate user-controlled data without explicit HTML escaping upstream.
4. **No business logic.** Components render what they're given.

## Forbidden patterns

- Hardcoded colours outside the variant tables.
- Inline styles.
- Using `dangerouslySetInnerHTML` anywhere except `JsonLd`.
- Adding business data to `src/` — components consume data, they don't fetch it.

## Testing requirements

- jest-axe accessibility assertions for every interactive component.
- Behaviour tests cover variant/size class application and the default `type="button"` guarantee.

## Pointers

- Consumers: `../../apps/web/src/app/**`.
- Root: `../../CLAUDE.md`.
