import Config from "#/constants/Config";
import { createClient, get as netGet } from "#/helpers/utils/networking";
import type { LoadArticlePostProperties } from "#/types";

const BASE_URL = Config.wp2Url ?? "https://www.pruefpunkt.org";

export default class PruefpunktAPI {
  static readonly client = createClient(BASE_URL);

  static async getPosts(page = 1): Promise<LoadArticlePostProperties[]> {
    return await netGet<LoadArticlePostProperties[]>(
      PruefpunktAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: {
          per_page: 10,
          page,
          orderby: "date",
          order: "desc",
          _: Date.now(),
        },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  static async searchPosts(
    search: string,
    page = 10,
  ): Promise<LoadArticlePostProperties[]> {
    return await netGet<LoadArticlePostProperties[]>(
      PruefpunktAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: { orderby: "relevance", search, page },
      },
    );
  }
}
