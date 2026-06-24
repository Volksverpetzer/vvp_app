import * as Application from "expo-application";
import { Dimensions, Platform } from "react-native";

import Config from "#/constants/Config";
import { resolveAnalyticsSite } from "#/helpers/utils/analyticsSite";
import { createClient, post } from "#/helpers/utils/networking";

const plausibleClient = createClient("https://plausible.io");

/**
 * Sends an event to Plausible Analytics
 * @param permalink - Link of the current Resource
 * @param event - Event Name
 * @param properties - Additional properties
 * @param utm_campaign - UTM campaign (default: "app")
 * @param utm_source - UTM source (default: "app")
 * @returns Promise<void>
 */
const registerEvent = async (
  permalink: string,
  event: string,
  properties?: Record<string, unknown>,
  utm_campaign = "app",
  utm_source = "app",
): Promise<void> => {
  if (!Config.enableAnalytics) return;
  const payload = {
    name: event,
    url: `${permalink}?utm_source=${utm_source}&utm_medium=app&utm_campaign=${utm_campaign}`,
    referrer: "de.volksverpetzer.app",
    domain: resolveAnalyticsSite(permalink),
    props: {
      platform: Platform.OS,
      OSversion: Platform.Version,
      appVersion: Application?.nativeApplicationVersion,
      appBuild: Application?.nativeBuildVersion,
      width: Dimensions.get("window").width,
      ...properties,
    },
  };
  try {
    await post<unknown, typeof payload>(plausibleClient, "/api/event", payload);
  } catch (error) {
    console.error(error);
  }
};

export { registerEvent };
