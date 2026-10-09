import Config from "#/constants/Config";
import { getApiUrl } from "#/helpers/apiUrl";
import { createClient, get } from "#/helpers/utils/networking";

const client = createClient(getApiUrl);

/**
 * Fetches the regions from the counter API
 */
const getRegions = async (): Promise<string> => {
  if (!Config.enableActions) {
    return "";
  }

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
