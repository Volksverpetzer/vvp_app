import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

import { ClaimProperties } from "../../components/posts/ClaimPost";
import { InstaPostProperties } from "../../components/posts/InstaPost";
import { MastodonPostProperties } from "../../components/posts/MastodonPost";
import { TiktokPostProperties } from "../../components/posts/TiktokPost";
import { YTPostProperties } from "../../components/posts/YTPost";
import Config from "../../constants/Config";
import {
  AISearchResponse,
  NotificationSettingType,
  Report,
  StatusResponse,
  StoredReport,
} from "../../types";
import { createClient, get as netGet, post as netPost } from "../Networking";

/**
 * The API class provides methods for making HTTP requests and fetching data from an API.
 */
class API {
  private static client = createClient(Config.apiUrl);

  /**
   * GET request wrapper. Accepts optional config and abortTime.
   */
  static async get<T>(path: string, abortTime?: number): Promise<T> {
    return netGet<T>(API.client, path, undefined, abortTime);
  }

  /**
   * POST request wrapper. Accepts optional config and abortTime.
   */
  static async post<T, D>(
    path: string,
    data: D,
    abortTime?: number,
  ): Promise<T> {
    return netPost<T, D>(API.client, path, data, abortTime);
  }

  /**
   * Fetches the Instagram feed.
   */
  static async getInstaFeed(): Promise<InstaPostProperties[]> {
    const response = await API.get<{ data: InstaPostProperties[] }>(
      "/proxy/instaFeed",
    );
    return response.data ?? [];
  }

  /**
   * Fetches the Instagram meme feed.
   */
  static async getInstaMemeFeed(): Promise<InstaPostProperties[]> {
    const response = await API.get<{ data: InstaPostProperties[] }>(
      "/proxy/instaMemeFeed",
    );
    return response.data ?? [];
  }

  /**
   * Fetches a specific Instagram post by ID.
   */
  static async getInstaPost(id: string): Promise<InstaPostProperties> {
    return await API.get<InstaPostProperties>("/proxy/instaById/" + id);
  }

  /**
   * Fetches the fact feed based on keywords.
   */
  static async getFactFeed(keywords: string[]): Promise<ClaimProperties[]> {
    const response = await API.get<{ claims: ClaimProperties[] }>(
      "/googleFact?keywords=" + keywords.join(","),
    );
    return response.claims ?? [];
  }

  /**
   * Fetches the Mastodon feed.
   */
  static async getMastodonFeed(): Promise<MastodonPostProperties[]> {
    const response = await API.get<{ data: MastodonPostProperties[] }>(
      "/proxy/mastodon",
    );
    return response.data ?? [];
  }

  /**
   * Fetches the Bluesky feed.
   */
  static async getBskyFeed(): Promise<FeedViewPost[]> {
    const response = await API.get<{ feed: FeedViewPost[] }>(
      "/proxy/blueskyFeed",
    );
    return response.feed ?? [];
  }

  /**
   * Fetches the bot feed.
   */
  static async getBotFeed(): Promise<FeedViewPost[]> {
    const response = await API.get<{ feed: FeedViewPost[] }>("/botFeed");
    return response.feed ?? [];
  }

  /**
   * Fetches the YouTube feed.
   */
  static async getYouTubeFeed(): Promise<YTPostProperties[]> {
    const response = await API.get<{ items: YTPostProperties[] }>(
      "/proxy/ytAPI",
    );
    return response.items ?? [];
  }

  /**
   * Fetches the TikTok feed.
   */
  static async getTikTokFeed(): Promise<TiktokPostProperties[]> {
    const response = await API.get<{
      data: { data: { videos: TiktokPostProperties[] } };
    }>("/tiktok/tiktokFeed");
    return response?.data?.data?.videos ?? [];
  }

  /**
   * Registers a device for push notifications.
   */
  static async registerNotifications(body: {
    expo_token: string;
    settings: NotificationSettingType;
    os: string;
    version: string;
  }): Promise<{ status: string }> {
    return await API.post("/register", body);
  }

  /**
   * Creates a payment intent for a specific amount.
   */
  static async paymentIntent(
    amount: number,
  ): Promise<{ client_secret: string }> {
    return await API.get<{ client_secret: string }>(
      "/paymentIntent?amount=" + amount,
    );
  }

  /**
   * Reports a fake post.
   */
  static async reportFake(report: Report): Promise<StoredReport> {
    return await API.post<StoredReport, Report>("/reportFake", report);
  }

  /**
   * Fetch status of a report
   */
  static async getReportStatus(uuid: string): Promise<StatusResponse> {
    return await API.get<StatusResponse>("/statusFake/" + uuid);
  }

  /**
   * Fetches recommendations based on a slug.
   */
  static async getRecommendations(
    slug: string,
  ): Promise<{ matches: string[] }> {
    return await API.get<{ matches: string[] }>(`/recommend?slug=${slug}`);
  }

  /**
   * Performs an AI search based on a query.
   */
  static async postAISearch(body: {
    query: string;
  }): Promise<AISearchResponse[]> {
    const { query } = body;
    const data = await API.post<
      { results: AISearchResponse[] },
      { query: string; n_results: number }
    >("/ai_search", { query, n_results: 20 });
    return data.results;
  }
}

export default API;
