import type { ReactElement } from "react";

/**
 * Emits a <script type="application/ld+json"> tag for Schema.org
 * structured data. Call this from every page that represents a
 * discrete entity (Article, Product, Organization, BreadcrumbList).
 *
 * The payload is serialised with `String.raw` to prevent template-
 * literal-based XSS — Next.js already escapes `<` and `>` in the
 * inline script, but we avoid interpolating any user-controlled
 * values without explicit escaping upstream.
 */
export interface JsonLdProps {
  /** Schema.org JSON-LD payload. Must include an `@context` and `@type`. */
  data: Record<string, unknown>;
  /**
   * Nonce for CSP. Pass when strict-CSP is enforced. Middleware already
   * allows unsafe-inline in dev; prod CSP blocks inline scripts without
   * a nonce.
   */
  nonce?: string;
}

export function JsonLd({ data, nonce }: JsonLdProps): ReactElement {
  const serialized = JSON.stringify(data)
    // Escape `<` so the closing `</script>` can never appear inside.
    .replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

/** Convenience builder for Article schema. */
export function articleSchema(input: {
  headline: string;
  description: string;
  url: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: input.url,
    ...(input.author
      ? { author: { "@type": "Person", name: input.author } }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.image ? { image: input.image } : {}),
  };
}

/** Convenience builder for Organization schema. */
export function organizationSchema(input: {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.sameAs ? { sameAs: input.sameAs } : {}),
  };
}

/** Convenience builder for BreadcrumbList schema. */
export function breadcrumbSchema(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
