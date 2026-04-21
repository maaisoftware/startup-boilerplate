import { describe, expect, it } from "vitest";

import {
  auditLog,
  media,
  navigation,
  newsletters,
  pageBlocks,
  pages,
  posts,
  profiles,
  seoOverrides,
  subscribers,
  userRoles,
} from "./schema/index.ts";

/**
 * Unit tests that guard the Drizzle schema shape. They don't require a DB
 * — they assert that the exported tables have the columns the rest of the
 * app depends on, so a refactor cannot silently drop a column.
 */
describe("Drizzle schema", () => {
  it("exports every table listed in the plan", () => {
    const exported = [
      profiles,
      userRoles,
      posts,
      pages,
      pageBlocks,
      media,
      newsletters,
      subscribers,
      navigation,
      seoOverrides,
      auditLog,
    ];
    for (const table of exported) {
      expect(table).toBeDefined();
    }
  });

  it("posts exposes the canonical columns", () => {
    const columns = Object.keys(posts);
    expect(columns).toEqual(
      expect.arrayContaining([
        "id",
        "slug",
        "title",
        "excerpt",
        "contentMarkdown",
        "status",
        "publishedAt",
        "authorId",
        "coverMediaId",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("audit_log exposes the fields the proxy writes on every mutation", () => {
    const columns = Object.keys(auditLog);
    expect(columns).toEqual(
      expect.arrayContaining([
        "id",
        "userId",
        "action",
        "resourceType",
        "resourceId",
        "metadata",
        "ipAddress",
        "userAgent",
        "createdAt",
      ]),
    );
  });

  it("subscribers schema supports double-opt-in state transitions", () => {
    const columns = Object.keys(subscribers);
    expect(columns).toEqual(
      expect.arrayContaining([
        "status",
        "confirmationToken",
        "subscribedAt",
        "confirmedAt",
        "unsubscribedAt",
      ]),
    );
  });
});
