import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Button } from "./button.tsx";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("defaults to type='button' so forms do not submit accidentally", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("honours the variant and size props via class names", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-600");
    expect(btn.className).toContain("h-12");
  });

  it("is accessible (jest-axe)", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
