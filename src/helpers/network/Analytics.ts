import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { Dimensions, Platform } from "react-native";

import Config from "#/constants/Config";
import { createClient, post } from "#/helpers/utils/networking";

const { wpUrl } = Config;
const plausibleClient = createClient("https://plausible.io");

/**
 * Sends an event to Plausible Analytics
 * @param permalink - Link of the current Resource
 * @param event - Event Name
 * @param properties - Additional properties
 * @param utm_campaign - UTM campaign (default: "app")
 * @param utm_source - UTM source (default: "app")
 * @returns Promise<unknown> - Response data
 */
const registerEvent = async (
  permalink: string,
  event: string,
  properties?: object,
  utm_campaign = "app",
  utm_source = "app",
): Promise<unknown> => {
  if (!Config.enableAnalytics) return;
  const { hostname } = Linking.parse(wpUrl);
  const payload = {
    name: event,
    url: `${permalink}?utm_source=${utm_source}&utm_medium=app&utm_campaign=${utm_campaign}`,
    referrer: "de.volksverpetzer.app",
    domain: hostname,
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
    return await post<unknown, typeof payload>(
      plausibleClient,
      "/api/event",
      payload,
    );
  } catch (error) {
    console.error(error);
    return error;
  }
};

export { registerEvent };
