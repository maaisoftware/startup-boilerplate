/**
 * Public entry point.
 *
 * Re-exports schemas and types only. Consumers that need runtime
 * validation should import from the specific entry:
 *
 *   - Server code: `import { getServerEnv } from "@startup-boilerplate/env/server"`
 *   - Client code: `import { getClientEnv } from "@startup-boilerplate/env/client"`
 *
 * Mixing the two is an error: importing `./server` from a client component
 * triggers the `server-only` package's compile-time guard.
 */

export {
  clientSchema,
  fullSchema,
  serverSchema,
  type ClientEnv,
  type FullEnv,
  type ServerEnv,
} from "./schema.ts";
export { formatEnvError } from "./format.ts";
