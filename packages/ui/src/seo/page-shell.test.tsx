import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { articleSchema } from "./json-ld.tsx";
import { PageShell } from "./page-shell.tsx";

describe("PageShell", () => {
  it("renders heading + description and injects JSON-LD", () => {
    const schema = articleSchema({
      headline: "Hello",
      description: "d",
      url: "https://example.com",
    });
    const { container } = render(
      <PageShell title="Hello" description="A post" structuredData={schema}>
        <p>body</p>
      </PageShell>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hello",
    );
    expect(screen.getByText("A post")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(
      container.querySelector("script[type='application/ld+json']"),
    ).toBeInTheDocument();
  });

  it("passes jest-axe accessibility audit", async () => {
    const schema = articleSchema({
      headline: "Hello",
      description: "d",
      url: "https://example.com",
    });
    const { container } = render(
      <PageShell title="Hello" description="A post" structuredData={schema}>
        <p>body</p>
      </PageShell>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
