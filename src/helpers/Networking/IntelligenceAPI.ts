import Config from "../../constants/Config";
import { AISearchResponse } from "../../types";
import { createClient, get as netGet, post as netPost } from "../Networking";

/** Axios client for AI with Referer header set */
const intelligenceClient = createClient(Config.aiUrl);
intelligenceClient.defaults.headers.common["Referer"] = Config.aiUrl;

/**
 * The IntelligenceAPI class provides methods for making HTTP requests and fetching data from an API.
 */
class IntelligenceAPI {
  private static client = intelligenceClient; // using AI client with Referer header

  /**
   * POST request wrapper.
   */
  static async post<T, D>(path: string, data: D): Promise<T> {
    return netPost<T, D>(this.client, path, data);
  }

  /**
   * GET request wrapper
   */
  static async get<T>(path: string): Promise<T> {
    return netGet<T>(this.client, path);
  }

  /**
   * Performs an AI search based on a query.
   */
  static async vectorSearch(query: string): Promise<AISearchResponse[]> {
    const rawResponse = await this.post<
      {
        results: {
          id: string;
          title: string;
          excerpt: string;
          url: string;
          distance: number;
          rerank_score: number | null;
        }[];
      },
      { query: string; n_results: number }
    >("/api/vector-search/", { query, n_results: 20 });
    return rawResponse.results.map((item) => ({
      url: item.url,
      text: item.excerpt,
      title: item.title,
    }));
  }

  static async recommendations(
    url: string,
  ): Promise<{ results: { url: string; title: string }[] }> {
    return await this.get<{
      results: { url: string; title: string }[];
    }>(`/api/recommend/?url=${url}`);
  }
}

export default IntelligenceAPI;
