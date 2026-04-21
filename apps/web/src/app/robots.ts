import type { MetadataRoute } from "next";

import { getClientEnv } from "@startup-boilerplate/env/client";

export default function robots(): MetadataRoute.Robots {
  const origin = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
