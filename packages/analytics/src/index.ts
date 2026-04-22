export {
  createFetchGA4Client,
  GA4Analytics,
  type FetchGA4ClientOptions,
  type GA4AnalyticsOptions,
  type GA4Client,
} from "./adapters/ga4.ts";
export {
  createFetchMixpanelClient,
  MixpanelAnalytics,
  type FetchMixpanelClientOptions,
  type MixpanelAnalyticsOptions,
  type MixpanelClient,
} from "./adapters/mixpanel.ts";
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
