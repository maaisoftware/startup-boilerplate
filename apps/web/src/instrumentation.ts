/**
 * Next.js instrumentation hook.
 *
 * Called exactly once when the Node server boots (dev, production, edge).
 * By this point Next.js has already merged `.env.local` / `.env` into
 * process.env, so environment validation can run safely.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export function register(): void {
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    // Import dynamically so the `server-only` guard in the imported module
    // does not run during build-time static analysis of this file.
    void import("@startup-boilerplate/env/server-only").then(
      ({ validateServerEnv }) => {
        validateServerEnv();
      },
    );
  }
}
