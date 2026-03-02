import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { Dimensions, Platform } from "react-native";

import Config from "#/constants/Config";
import { createClient, get, post } from "#/helpers/utils/networking";
import type { HttpsUrl } from "#/types";

const { apiUrl, wpUrl } = Config;

const client = createClient(apiUrl);
const plausibleClient = createClient("https://plausible.io");

/**
 * Returns the page views for the current permalink
 * @param permalink - Link of the current Resource
 * @returns Promise<number> - Number of views
 */
const getViews = async (permalink: string): Promise<number> => {
  const { path } = Linking.parse(permalink || wpUrl);
  const endpoint = "/proxy/stats/" + path;
  try {
    const data = await get<{ pageviews: number }>(client, endpoint);
    return data.pageviews;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

/**
 * Fetches the regions from the counter API
 */
const getRegions = async (): Promise<string> => {
  try {
    return await get<string>(client, "/proxy/regions", {
      responseType: "text",
    });
  } catch (error) {
    console.error("getRegions error:", error);
    return "";
  }
};

/**
 * Returns the number of shares for the given permalink
 * @param permalink - Link of the current Resource
 * @returns Promise<number> - Number of shares
 */
const getShares = async (permalink: string): Promise<number> => {
  const { path } = Linking.parse(permalink || wpUrl);
  try {
    const data = await get<{ events: number }>(client, `/proxy/shares/${path}`);
    return data.events;
  } catch (error) {
    console.error("getShares error:", error);
    return 0;
  }
};

/**
 * Returns the number of favorites for the given permalink
 * @param permalink - Link of the current Resource
 * @returns Promise<number> - Number of favorites
 */
const getFavs = async (permalink: string): Promise<number> => {
  const { path } = Linking.parse(permalink || wpUrl);
  try {
    const data = await get<{ events: number }>(client, `/proxy/favs/${path}`);
    return data.events;
  } catch (error) {
    console.error("getFavs error:", error);
    return 0;
  }
};

/**
 * Returns an array of links and their visitors for the given permalink
 * @param permalink - Link of the current Resource
 * @returns Promise<Array<{ url: string, visitors: number }>> - Array of links and their visitors
 */
const getLinks = async (
  permalink: string,
): Promise<{ url: HttpsUrl; visitors: number }[]> => {
  const { path } = Linking.parse(permalink);
  try {
    const data = await get<{ links: { url: HttpsUrl; visitors: number }[] }>(
      client,
      `/proxy/links/${path}`,
    );
    return data.links;
  } catch (error) {
    console.error("getLinks error:", error);
    return [];
  }
};

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
  if (!Config.analytics) return;
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

/**
 * Sends a page view to Plausible Analytics
 * @param permalink - Link of the current Resource
 * @returns Promise<unknown> - Response data
 */
const registerViews = (permalink: string): Promise<unknown> =>
  registerEvent(permalink, "pageviews");

/**
 * Register Favorite
 * @param permalink - Link of the current Resource
 * @returns Promise<unknown> - Response data
 */
const registerFav = (permalink: string): Promise<unknown> =>
  registerEvent(permalink, "favorite");

export {
  registerViews,
  getViews,
  registerEvent,
  getShares,
  getLinks,
  getRegions,
  getFavs,
  registerFav,
};
