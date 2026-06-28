import * as Application from "expo-application";
import { Dimensions, Platform } from "react-native";

import Config from "#/constants/Config";
import { resolveAnalyticsSite } from "#/helpers/utils/analyticsSite";
import { createClient, post } from "#/helpers/utils/networking";

const plausibleClient = createClient("https://plausible.io");

/**
 * Every event name the app reports to Plausible. Kept as a closed union so the
 * set of events stays a single, discoverable catalog and typos (e.g.
 * "pageview" vs "pageviews") are caught at compile time. Add new names here.
 */
export type AnalyticsEvent =
  | "pageviews"
  | "favorite"
  | "Share"
  | "FullRead"
  | "search"
  | "Shop"
  | "Steady"
  | "DonateConversion"
  | "Outbound Link: Click"
  | "Report Submitted"
  | "Pruefpunkt View"
  | "Post Interaction";

/**
 * Props that registerEvent always sets on every event. Callers must not pass
 * these keys: the base props are spread after `...properties` so they always
 * win at runtime, meaning a caller's reserved key (e.g. the OS `platform`)
 * would be silently dropped. The type guard below rejects these keys for
 * narrow literal types to surface the mistake at the call site rather than
 * letting it become a confusing no-op.
 */
type ReservedPropKey =
  | "platform"
  | "OSversion"
  | "appVersion"
  | "appBuild"
  | "buildLabel"
  | "width";

/**
 * Custom event properties: any keys/values, except that any reserved base-prop
 * key present in `T` is forced to `never`, making it a compile error to pass
 * one. A plain `Record & { reserved?: never }` would not work — the open index
 * signature lets the reserved key through — so the rejection is keyed off the
 * caller's inferred `T`.
 */
export type EventProps<T extends Record<string, unknown>> = T & {
  [K in Extract<keyof T, ReservedPropKey>]: never;
};

/**
 * Sends an event to Plausible Analytics
 * @param permalink - Link of the current Resource
 * @param event - Event Name
 * @param properties - Additional properties (reserved base-prop keys are rejected)
 * @param utm_campaign - UTM campaign (default: "app")
 * @param utm_source - UTM source (default: "app")
 * @returns Promise<void>
 */
const registerEvent = async <T extends Record<string, unknown>>(
  permalink: string,
  event: AnalyticsEvent,
  properties?: EventProps<T>,
  utm_campaign = "app",
  utm_source = "app",
): Promise<void> => {
  if (!Config.enableAnalytics) return;
  // Skip beta store builds so pre-release testing traffic doesn't distort the
  // real user analytics. Production builds set no buildLabel.
  if (Config.buildLabel === "beta") return;
  // Fall back to the primary site when no resource link is provided (e.g. an
  // outbound link tapped without article context), so the event URL and site
  // are always well-formed instead of "undefined?...".
  const resource = permalink || Config.wpUrl;
  const payload = {
    name: event,
    url: `${resource}?utm_source=${utm_source}&utm_medium=app&utm_campaign=${utm_campaign}`,
    referrer: "de.volksverpetzer.app",
    domain: resolveAnalyticsSite(resource),
    props: {
      // Caller props are spread first so the base props below always win:
      // the EventProps type rejects reserved keys for narrow literals, but a
      // widened `Record<string, unknown>` (e.g. Sharing's `...properties`)
      // slips past the type guard, so this ordering is what actually
      // guarantees base props can never be overwritten at runtime.
      ...properties,
      platform: Platform.OS,
      OSversion: Platform.Version,
      appVersion: Application?.nativeApplicationVersion,
      appBuild: Application?.nativeBuildVersion,
      // Marks non-production store builds so traffic can be segmented in Plausible.
      // Note: "beta" builds are skipped entirely above (no events sent).
      // Production builds set no buildLabel, so we default to "production" for consistency.
      buildLabel: Config.buildLabel ?? "production",
      width: Dimensions.get("window").width,
    },
  };
  try {
    await post<unknown, typeof payload>(plausibleClient, "/api/event", payload);
  } catch (error) {
    console.error(error);
  }
};

type PostPlatform = "youtube" | "tiktok" | "instagram" | "bluesky";
type PostAction = "play" | "open";

/**
 * Records a real interaction with a social post in the feed, beyond the fav and
 * share buttons that are already tracked: playing a video, opening a thread, or
 * expanding a card. All such interactions share one Plausible event so feed
 * engagement can be compared across post types, broken down by the `platform`
 * and `action` props.
 */
const registerPostInteraction = (
  permalink: string,
  platform: PostPlatform,
  action: PostAction,
): Promise<void> =>
  registerEvent(permalink, "Post Interaction", { platform, action });

export { registerEvent, registerPostInteraction };
