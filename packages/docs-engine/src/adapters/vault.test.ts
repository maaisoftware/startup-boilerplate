import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runDocsEngineContract } from "../contract.ts";
import { VaultDocsEngine } from "./vault.ts";

const root = join(tmpdir(), `docs-engine-${Date.now()}`);

beforeAll(async () => {
  await mkdir(join(root, "nested"), { recursive: true });
  await writeFile(
    join(root, "index.md"),
    `---
title: Index page
status: active
related: [a, b]
---
# Index page

Body content.
`,
  );
  await writeFile(
    join(root, "nested", "deep.md"),
    "# Deep page\n\nno frontmatter.\n",
  );
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

runDocsEngineContract("VaultDocsEngine", () => new VaultDocsEngine({ root }));

describe("VaultDocsEngine specifics", () => {
  it("lists nested markdown files", async () => {
    const engine = new VaultDocsEngine({ root });
    const entries = await engine.list();
    const slugs = entries.map((e) => e.slug).sort();
    expect(slugs).toEqual(["index", "nested/deep"]);
  });

  it("parses frontmatter into typed fields", async () => {
    const engine = new VaultDocsEngine({ root });
    const entry = await engine.get("index");
    expect(entry?.frontmatter).toMatchObject({
      title: "Index page",
      status: "active",
      related: ["a", "b"],
    });
    expect(entry?.title).toBe("Index page");
  });

  it("falls back to the first # heading when there's no frontmatter title", async () => {
    const engine = new VaultDocsEngine({ root });
    const entry = await engine.get("nested/deep");
    expect(entry?.title).toBe("Deep page");
  });

  it("returns null for missing slugs", async () => {
    const engine = new VaultDocsEngine({ root });
    expect(await engine.get("never")).toBeNull();
  });

  it("tolerates a non-existent root without throwing", async () => {
    const engine = new VaultDocsEngine({ root: join(root, "does-not-exist") });
    await expect(engine.list()).resolves.toEqual([]);
    await expect(engine.get("anything")).resolves.toBeNull();
  });
});
