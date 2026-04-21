import { expect, test } from "@playwright/test";

/**
 * Smoke suite. Proves the stack boots and every page ships the SEO
 * primitives we promise (title, description, JSON-LD, canonical-ish
 * URL via <meta> tags).
 */
test.describe("smoke", () => {
  test("home page loads with JSON-LD and OG metadata", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    // Root page's own <title> comes from its `metadata.title` export
    // ("Dashboard" in v0.1). The root layout's template would suffix the
    // app name for nested routes; matching either here so the assertion
    // doesn't lock us into a specific composition.
    await expect(page).toHaveTitle(/Dashboard|Startup Boilerplate/);
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toMatch(/Startup Boilerplate/);
    // JSON-LD presence — Organization schema from the Dashboard page.
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd).toContain('"@type":"Organization"');
  });

  test("blog index renders seeded posts and has breadcrumb JSON-LD", async ({
    page,
  }) => {
    await page.goto("/blog");
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd).toContain("BreadcrumbList");
    // Seeded post from supabase/seed.sql:
    await expect(page.getByText("Hello, world")).toBeVisible();
  });

  test("post detail renders Article JSON-LD", async ({ page }) => {
    await page.goto("/blog/hello-world");
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLd).toContain("Article");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Hello, world",
    );
  });

  test("/api/health returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { status: string; name: string };
    expect(body.status).toBe("ok");
    expect(body.name).toBeTruthy();
  });

  test("sitemap.xml lists posts + pages", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("/blog/hello-world");
    expect(body).toContain("/about");
  });

  test("robots.txt points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.toLowerCase()).toContain("sitemap:");
  });

  test("llms.txt exposes primary paths", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("/blog");
    expect(body).toContain("Disallowed");
  });
});
