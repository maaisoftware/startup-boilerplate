import { describe, expect, it } from "vitest";

import type { Cms } from "./interfaces.ts";

/**
 * Shared contract suite. Every CMS adapter must pass against seeded data
 * that includes at least one published post with slug "hello-world" and
 * one published page with slug "about".
 */
export function runCmsContract(
  name: string,
  create: () => Cms | Promise<Cms>,
): void {
  describe(`${name} — CMS contract`, () => {
    it("lists published posts with a nextCursor shape", async () => {
      const cms = await create();
      const result = await cms.listPublishedPosts({ limit: 5 });
      expect(Array.isArray(result.posts)).toBe(true);
      expect(result).toHaveProperty("nextCursor");
    });

    it("returns the seeded hello-world post by slug", async () => {
      const cms = await create();
      const post = await cms.getPublishedPostBySlug("hello-world");
      expect(post?.slug).toBe("hello-world");
      expect(typeof post?.title).toBe("string");
    });

    it("returns null for unknown post slugs", async () => {
      const cms = await create();
      expect(await cms.getPublishedPostBySlug("missing-slug-xyz")).toBeNull();
    });

    it("lists published pages", async () => {
      const cms = await create();
      const pagesList = await cms.listPublishedPages();
      expect(Array.isArray(pagesList)).toBe(true);
      expect(pagesList.length).toBeGreaterThan(0);
    });

    it("returns the about page with blocks (blocks may be empty)", async () => {
      const cms = await create();
      const result = await cms.getPublishedPageWithBlocks("about");
      expect(result?.page.slug).toBe("about");
      expect(Array.isArray(result?.blocks)).toBe(true);
    });

    it("returns null for an unknown page slug", async () => {
      const cms = await create();
      expect(
        await cms.getPublishedPageWithBlocks("missing-page-xyz"),
      ).toBeNull();
    });

    it("lists navigation entries ordered by position", async () => {
      const cms = await create();
      const entries = await cms.listNavigation();
      for (let i = 1; i < entries.length; i += 1) {
        const prev = entries[i - 1]!;
        const curr = entries[i]!;
        expect(curr.position).toBeGreaterThanOrEqual(prev.position);
      }
    });
  });
}
