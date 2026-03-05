import Config from "#/constants/Config";
import { createClient, get } from "#/helpers/utils/networking";

const { apiUrl } = Config;
const client = createClient(apiUrl);

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

export { getRegions };
