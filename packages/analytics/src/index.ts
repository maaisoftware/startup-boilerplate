export { NoopAnalytics } from "./adapters/noop.ts";
export { PostHogAnalytics, type PostHogClient } from "./adapters/posthog.ts";
export { getAnalytics } from "./factory.ts";
export type {
  Analytics,
  CaptureInput,
  DistinctId,
  EventProperties,
  UserTraits,
} from "./interfaces.ts";
