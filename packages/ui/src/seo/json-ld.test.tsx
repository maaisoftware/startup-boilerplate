import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  articleSchema,
  breadcrumbSchema,
  JsonLd,
  organizationSchema,
} from "./json-ld.tsx";

describe("JsonLd", () => {
  it("renders a application/ld+json script with the serialised payload", () => {
    const { container } = render(
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "x",
        }}
      />,
    );
    const script = container.querySelector("script");
    expect(script?.getAttribute("type")).toBe("application/ld+json");
    expect(script?.innerHTML).toContain('"@type":"Article"');
  });

  it("escapes < so closing script tags never appear in JSON", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", name: "</script>" }} />,
    );
    const script = container.querySelector("script");
    expect(script?.innerHTML).not.toContain("</script>");
    expect(script?.innerHTML).toContain("\\u003c");
  });

  it("includes the nonce when provided", () => {
    const { container } = render(<JsonLd data={{}} nonce="n1" />);
    expect(container.querySelector("script")?.getAttribute("nonce")).toBe("n1");
  });
});

describe("schema builders", () => {
  it("articleSchema includes the required fields", () => {
    const schema = articleSchema({
      headline: "Hi",
      description: "desc",
      url: "https://example.com/post",
      author: "Marlon",
      datePublished: "2026-04-21T00:00:00Z",
    });
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Hi",
      author: { "@type": "Person", name: "Marlon" },
    });
  });

  it("organizationSchema includes optional fields only when supplied", () => {
    const minimal = organizationSchema({ name: "ACME", url: "https://acme" });
    expect(minimal).not.toHaveProperty("logo");
    const full = organizationSchema({
      name: "ACME",
      url: "https://acme",
      logo: "https://acme/logo.png",
      sameAs: ["https://x.com/acme"],
    });
    expect(full["logo"]).toBe("https://acme/logo.png");
    expect(full["sameAs"]).toEqual(["https://x.com/acme"]);
  });

  it("breadcrumbSchema builds the item list with 1-indexed positions", () => {
    const schema = breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]);
    expect(schema["itemListElement"]).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "/blog" },
    ]);
  });
});
