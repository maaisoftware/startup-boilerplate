import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import type { DocEntry, DocsEngine } from "../interfaces.ts";

export interface VaultDocsEngineOptions {
  /** Absolute path to the knowledge/ vault. */
  root: string;
}

/**
 * Reads a directory of markdown files and returns the parsed entries.
 * Frontmatter is parsed naively (YAML-ish, `key: value`); if you need
 * richer parsing, swap to gray-matter in a future adapter.
 */
export class VaultDocsEngine implements DocsEngine {
  private readonly root: string;

  constructor(options: VaultDocsEngineOptions) {
    this.root = options.root;
  }

  async list(): Promise<DocEntry[]> {
    const files = await walkMarkdown(this.root);
    const entries = await Promise.all(
      files.map((path) => readEntry(this.root, path)),
    );
    return entries.filter((e): e is DocEntry => e !== null);
  }

  async get(slug: string): Promise<DocEntry | null> {
    const files = await walkMarkdown(this.root);
    for (const path of files) {
      if (deriveSlug(this.root, path) === slug) {
        return await readEntry(this.root, path);
      }
    }
    return null;
  }
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = [];
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    const full = join(dir, name);
    const stats = await stat(full);
    if (stats.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (stats.isFile() && name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

async function readEntry(root: string, path: string): Promise<DocEntry | null> {
  try {
    const [raw, stats] = await Promise.all([
      readFile(path, "utf8"),
      stat(path),
    ]);
    const { frontmatter, body } = parseFrontmatter(raw);
    const frontmatterTitle = frontmatter["title"];
    const title =
      typeof frontmatterTitle === "string"
        ? frontmatterTitle
        : (deriveTitleFromBody(body) ?? deriveSlug(root, path));
    return {
      slug: deriveSlug(root, path),
      title,
      body,
      frontmatter,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

function deriveSlug(root: string, path: string): string {
  return relative(root, path).replace(/\.md$/, "").split(sep).join("/");
}

function deriveTitleFromBody(body: string): string | null {
  const match = /^#\s+(.+)$/m.exec(body);
  return match ? (match[1]?.trim() ?? null) : null;
}

function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { frontmatter: {}, body: raw };
  const [, yaml, body] = match;
  const frontmatter: Record<string, unknown> = {};
  for (const line of (yaml ?? "").split(/\r?\n/)) {
    const sepIdx = line.indexOf(":");
    if (sepIdx === -1) continue;
    const key = line.slice(0, sepIdx).trim();
    const value = line.slice(sepIdx + 1).trim();
    if (!key) continue;
    frontmatter[key] = coerce(value);
  }
  return { frontmatter, body: body ?? "" };
}

function coerce(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  // array like [a, b, c]
  const arr = /^\[(.*)\]$/.exec(value);
  if (arr) {
    return (arr[1] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return value;
}
