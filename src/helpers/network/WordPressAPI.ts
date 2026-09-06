import { decode } from "html-entities";

import Config from "#/constants/Config";
import {
  CACHE_BUSTER_HEADERS,
  createClient,
  get as netGet,
} from "#/helpers/utils/networking";
import type {
  ArticleProperties,
  HttpsUrl,
  ImageCredit,
  LoadArticlePostProperties,
  MediaResponse,
} from "#/types";

export default class WordPressAPI {
  static readonly client = createClient(Config.wpUrl);

  // Image credit metadata doesn't change once an article is published, and the
  // same media (e.g. an author avatar, a reused featured image) is fetched
  // repeatedly while scrolling feeds — cache it for the session instead of
  // re-requesting it every time.
  private static readonly mediaCreditCache = new Map<
    string,
    ImageCredit | undefined
  >();

  /**
   * Get posts sorted by date (newest first).
   * @param page - The page number to fetch (pagination)
   * @returns Promise with an array of WordPress posts
   */
  static async getPosts(
    page?: number,
    signal?: AbortSignal,
  ): Promise<LoadArticlePostProperties[]> {
    // Add a timestamp to prevent caching issues
    const timestamp = Date.now();

    return await netGet<LoadArticlePostProperties[]>(
      WordPressAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: {
          per_page: 10,
          page: page || 1,
          orderby: "date",
          order: "desc", // descending order (newest first)
          _: timestamp, // Cache-busting parameter
          _embed: "author",
        },
        headers: CACHE_BUSTER_HEADERS,
        signal,
      },
    );
  }

  /**
   * Search posts by term.
   */
  static async searchPosts(
    search: string,
    page: number = 10,
    signal?: AbortSignal,
  ): Promise<LoadArticlePostProperties[]> {
    return await netGet<LoadArticlePostProperties[]>(
      WordPressAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: {
          orderby: "relevance",
          search,
          page: page,
          _embed: "author",
        },
        signal,
      },
    );
  }

  /**
   * Get a single post by slug.
   */
  static async getPost(
    slug: string,
    signal?: AbortSignal,
  ): Promise<LoadArticlePostProperties | undefined> {
    const posts = await netGet<LoadArticlePostProperties[]>(
      WordPressAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: {
          slug,
          _embed: "author",
        },
        signal,
      },
    );
    return posts[0] ?? undefined;
  }

  /**
   * Get the feature image.
   */
  static async getFeatureImage(
    href: string,
    signal?: AbortSignal,
  ): Promise<{
    image: string | undefined;
    thumb: string | undefined;
    credit: ImageCredit | undefined;
  }> {
    // Only request the fields we actually read: the full media object is large,
    // and scoping to these keeps the ISC `meta` from depending on site-specific
    // REST defaults (mirrors getMediaCredit).
    const data = await netGet<MediaResponse>(WordPressAPI.client, href, {
      params: { _fields: "source_url,media_details,meta" },
      signal,
    });
    const sizes = data?.media_details?.sizes;
    // Fall back to the full-size original when a WordPress site hasn't generated
    // intermediate image sizes (e.g. Prüfpunkt returns an empty `sizes` object).
    const image =
      sizes?.medium_large?.source_url ??
      sizes?.medium?.source_url ??
      data?.source_url;
    const thumb = sizes?.thumbnail?.source_url ?? data?.source_url;
    return { image, thumb, credit: WordPressAPI.extractImageCredit(data) };
  }

  /**
   * Parse the "Image Source Control" WordPress plugin metadata from a media
   * response. No source text means nothing worth showing (e.g. self-shot
   * images), so the credit stays undefined.
   */
  static extractImageCredit(data?: MediaResponse): ImageCredit | undefined {
    // All three are free-form WordPress admin input; trim and treat
    // whitespace-only values as absent so the UI never shows blank licences
    // or links with stray spaces.
    const source = data?.meta?.isc_image_source?.trim();
    return source
      ? {
          source,
          sourceUrl: data?.meta?.isc_image_source_url?.trim() || undefined,
          licence: data?.meta?.isc_image_licence?.trim() || undefined,
        }
      : undefined;
  }

  /**
   * Get the image credit for a media attachment by id, e.g. from the
   * wp-image-{id} class WordPress puts on images in post content.
   * @param mediaId - The attachment id
   * @param articleUrl - Any URL on the article's site; determines which
   *   WordPress API to query (articles can come from secondary sites)
   */
  static async getMediaCredit(
    mediaId: string,
    articleUrl: HttpsUrl,
    signal?: AbortSignal,
  ): Promise<ImageCredit | undefined> {
    const origin = new URL(articleUrl).origin;
    const cacheKey = `${origin}/${mediaId}`;
    if (WordPressAPI.mediaCreditCache.has(cacheKey)) {
      return WordPressAPI.mediaCreditCache.get(cacheKey);
    }

    const data = await netGet<MediaResponse>(
      WordPressAPI.client,
      `${origin}/wp-json/wp/v2/media/${mediaId}`,
      { params: { _fields: "meta" }, signal },
    );
    const credit = WordPressAPI.extractImageCredit(data);
    WordPressAPI.mediaCreditCache.set(cacheKey, credit);
    return credit;
  }

  /**
   * Creates a minimal WpApi object for any WordPress-compatible base URL.
   */
  static create(baseUrl: HttpsUrl) {
    const client = createClient(baseUrl);
    return {
      getPosts(
        page = 1,
        signal?: AbortSignal,
      ): Promise<LoadArticlePostProperties[]> {
        return netGet<LoadArticlePostProperties[]>(
          client,
          `/wp-json/wp/v2/posts`,
          {
            params: {
              per_page: 10,
              page,
              orderby: "date",
              order: "desc",
              _: Date.now(),
              _embed: "author",
            },
            headers: CACHE_BUSTER_HEADERS,
            signal,
          },
        );
      },
      searchPosts(
        search: string,
        page = 1,
        signal?: AbortSignal,
      ): Promise<LoadArticlePostProperties[]> {
        return netGet<LoadArticlePostProperties[]>(
          client,
          `/wp-json/wp/v2/posts`,
          {
            params: { orderby: "relevance", search, page, _embed: "author" },
            signal,
          },
        );
      },
      getPost(
        slug: string,
        signal?: AbortSignal,
      ): Promise<LoadArticlePostProperties | undefined> {
        return netGet<LoadArticlePostProperties[]>(
          client,
          `/wp-json/wp/v2/posts`,
          { params: { slug, _embed: "author" }, signal },
        ).then((posts) => posts[0] ?? undefined);
      },
    };
  }

  /**
   * Convert loaded article properties to ArticleProps.
   */
  static convertLoadProps(data: LoadArticlePostProperties): ArticleProperties {
    const description = data.yoast_head_json?.description ?? "";
    const title = decode(data.title?.rendered ?? "");
    const authors =
      data.authors?.length > 0
        ? data.authors
        : (data._embedded?.author ?? []).map((a) => ({
            display_name: a.name,
            slug: a.slug,
          }));
    return { ...data, title, description, authors };
  }
}
