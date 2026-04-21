import "server-only";

/**
 * Same API as `./server`, but gated by the `server-only` marker package.
 *
 * Import from this entry when you want Next.js to surface a compile-time
 * error if the module ever resolves into a client bundle. For boot-time
 * scripts (next.config.ts, CLI tools) that are not reached by the client
 * at all, `./server` is the correct entry.
 */
export {
  __resetServerEnvCacheForTests,
  getServerEnv,
  validateServerEnv,
  type ServerEnv,
} from "./server.ts";
