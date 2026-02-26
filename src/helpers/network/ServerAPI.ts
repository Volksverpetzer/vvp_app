import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

import { ClaimProperties } from "#/components/posts/ClaimPost";
import { InstaPostProperties } from "#/components/posts/InstaPost";
import { MastodonPostProperties } from "#/components/posts/MastodonPost";
import { TiktokPostProperties } from "#/components/posts/TiktokPost";
import { YouTubePostProperties } from "#/components/posts/YouTubePost";
import Config from "#/constants/Config";
import {
  createClient,
  get as netGet,
  post as netPost,
} from "#/helpers/utils/networking";
import {
  AISearchResponse,
  NotificationSettingType,
  Report,
  StatusResponse,
  StoredReport,
} from "#/types";

/**
 * The API class provides methods for making HTTP requests and fetching data from an API.
 */
class API {
  private static client = createClient(Config.apiUrl);

  /**
   * GET request wrapper. Accepts optional config and abortTime.
   */
  static get<T>(
    path: string,
    abortTime?: number,
    signal?: AbortSignal,
  ): Promise<T> {
    return netGet<T>(
      API.client,
      path,
      signal ? { signal } : undefined,
      abortTime,
    );
  }

  /**
   * POST request wrapper. Accepts optional config and abortTime.
   */
  static post<T, D>(
    path: string,
    data: D,
    abortTime?: number,
    signal?: AbortSignal,
  ): Promise<T> {
    return netPost<T, D>(
      API.client,
      path,
      data,
      abortTime,
      signal ? { signal } : undefined,
    );
  }

  /**
   * Fetches the Instagram feed.
   */
  static async getInstaFeed(
    signal?: AbortSignal,
  ): Promise<InstaPostProperties[]> {
    const response = await API.get<{ data: InstaPostProperties[] }>(
      "/proxy/instaFeed",
      undefined,
      signal,
    );
    return response.data ?? [];
  }

  /**
   * Fetches the Instagram meme feed.
   */
  static async getInstaMemeFeed(
    signal?: AbortSignal,
  ): Promise<InstaPostProperties[]> {
    const response = await API.get<{ data: InstaPostProperties[] }>(
      "/proxy/instaMemeFeed",
      undefined,
      signal,
    );
    return response.data ?? [];
  }

  /**
   * Fetches a specific Instagram post by ID.
   */
  static async getInstaPost(
    id: string,
    signal?: AbortSignal,
  ): Promise<InstaPostProperties> {
    return await API.get<InstaPostProperties>(
      "/proxy/instaById/" + id,
      undefined,
      signal,
    );
  }

  /**
   * Fetches the fact feed based on keywords.
   */
  static async getFactFeed(
    keywords: string[],
    signal?: AbortSignal,
  ): Promise<ClaimProperties[]> {
    const response = await API.get<{ claims: ClaimProperties[] }>(
      "/googleFact?keywords=" + keywords.join(","),
      undefined,
      signal,
    );
    return response.claims ?? [];
  }

  /**
   * Fetches the Mastodon feed.
   */
  static async getMastodonFeed(
    signal?: AbortSignal,
  ): Promise<MastodonPostProperties[]> {
    const response = await API.get<{ data: MastodonPostProperties[] }>(
      "/proxy/mastodon",
      undefined,
      signal,
    );
    return response.data ?? [];
  }

  /**
   * Fetches the Bluesky feed.
   */
  static async getBskyFeed(signal?: AbortSignal): Promise<FeedViewPost[]> {
    const response = await API.get<{ feed: FeedViewPost[] }>(
      "/proxy/blueskyFeed",
      undefined,
      signal,
    );
    return response.feed ?? [];
  }

  /**
   * Fetches the bot feed.
   */
  static async getBotFeed(signal?: AbortSignal): Promise<FeedViewPost[]> {
    const response = await API.get<{ feed: FeedViewPost[] }>(
      "/botFeed",
      undefined,
      signal,
    );
    return response.feed ?? [];
  }

  /**
   * Fetches the YouTube feed.
   */
  static async getYouTubeFeed(
    signal?: AbortSignal,
  ): Promise<YouTubePostProperties[]> {
    const response = await API.get<{ items: YouTubePostProperties[] }>(
      "/proxy/ytAPI",
      undefined,
      signal,
    );
    return response.items ?? [];
  }

  /**
   * Fetches the TikTok feed.
   */
  static async getTikTokFeed(
    signal?: AbortSignal,
  ): Promise<TiktokPostProperties[]> {
    const response = await API.get<{
      data: { data: { videos: TiktokPostProperties[] } };
    }>("/tiktok/tiktokFeed", undefined, signal);
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
    signal?: AbortSignal,
  ): Promise<{ client_secret: string }> {
    return await API.get<{ client_secret: string }>(
      "/paymentIntent?amount=" + amount,
      undefined,
      signal,
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
  static async getReportStatus(
    uuid: string,
    signal?: AbortSignal,
  ): Promise<StatusResponse> {
    return await API.get<StatusResponse>(
      "/statusFake/" + uuid,
      undefined,
      signal,
    );
  }

  /**
   * Fetches recommendations based on a slug.
   */
  static async getRecommendations(
    slug: string,
    signal?: AbortSignal,
  ): Promise<{ matches: string[] }> {
    return await API.get<{ matches: string[] }>(
      `/recommend?slug=${slug}`,
      undefined,
      signal,
    );
  }

  /**
   * Performs an AI search based on a query.
   */
  static async postAISearch(
    body: {
      query: string;
    },
    signal?: AbortSignal,
  ): Promise<AISearchResponse[]> {
    const { query } = body;
    const data = await API.post<
      { results: AISearchResponse[] },
      { query: string; n_results: number }
    >("/ai_search", { query, n_results: 20 }, undefined, signal);
    return data.results;
  }
}

export default API;
