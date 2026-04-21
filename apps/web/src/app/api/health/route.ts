import { NextResponse } from "next/server";

/**
 * Liveness probe.
 *
 * Returns 200 if the app is up. Does NOT verify downstream services
 * (DB, Supabase, etc.) — that's the readiness probe introduced in PR #6.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      name: process.env["NEXT_PUBLIC_APP_NAME"] ?? "startup-boilerplate",
      version: process.env["npm_package_version"] ?? "0.0.0",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
