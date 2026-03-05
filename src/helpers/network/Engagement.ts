import * as Linking from "expo-linking";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import { createClient, get } from "#/helpers/utils/networking";
import type { HttpsUrl } from "#/types";

const { apiUrl, wpUrl } = Config;
const client = createClient(apiUrl);

/**
 * Returns the page views for the current permalink
 * @param permalink - Link of the current Resource, defaults to Config.wpUrl if not provided
 * @returns Promise<number> - Number of views
 */
const getViews = async (permalink?: HttpsUrl): Promise<number> => {
  const { path } = Linking.parse(permalink ?? wpUrl);
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
 * @param permalink - Link of the current Resource, defaults to Config.wpUrl if not provided
 * @returns Promise<number> - Number of shares
 */
const getShares = async (permalink?: HttpsUrl): Promise<number> => {
  const { path } = Linking.parse(permalink ?? wpUrl);
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
 * @param permalink - Link of the current Resource, defaults to Config.wpUrl if not provided
 * @returns Promise<number> - Number of favorites
 */
const getFavs = async (permalink?: HttpsUrl): Promise<number> => {
  const { path } = Linking.parse(permalink ?? wpUrl);
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
 * @param permalink - Link of the current Resource, defaults to Config.wpUrl if not provided
 * @returns Promise<Array<{ url: string, visitors: number }>> - Array of links and their visitors
 */
const getLinks = async (
  permalink?: HttpsUrl,
): Promise<{ url: HttpsUrl; visitors: number }[]> => {
  const { path } = Linking.parse(permalink ?? wpUrl);
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
 * Sends a page view to Plausible Analytics
 * @param permalink - Link of the current Resource
 * @returns Promise<unknown> - Response data
 */
const registerViews = (permalink: string): Promise<unknown> => {
  if (!Config.enableEngagement) {
    return Promise.resolve(undefined);
  }

  return registerEvent(permalink, "pageviews");
};

/**
 * Register Favorite
 * @param permalink - Link of the current Resource
 * @returns Promise<unknown> - Response data
 */
const registerFav = (permalink: string): Promise<unknown> => {
  if (!Config.enableEngagement) {
    return Promise.resolve(undefined);
  }

  return registerEvent(permalink, "favorite");
};

export {
  getViews,
  getRegions,
  getShares,
  getFavs,
  getLinks,
  registerFav,
  registerViews,
};
