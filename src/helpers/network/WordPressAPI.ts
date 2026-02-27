import { decode } from "html-entities";

import { LoadArticlePostProperties } from "#/components/loader/LoadArticlePost";
import { ArticleProperties } from "#/components/posts/ArticlePost";
import Config from "#/constants/Config";
import { createClient, get as netGet } from "#/helpers/utils/networking";
import { MediaResponse } from "#/types";

export default class WordPressAPI {
  static readonly client = createClient(Config.wpUrl);

  /**
   * Get posts sorted by date (newest first).
   * @param page - The page number to fetch (pagination)
   * @returns Promise with an array of WordPress posts
   */
  static async getPosts(page?: number): Promise<LoadArticlePostProperties[]> {
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
        },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  /**
   * Search posts by term using axios.
   */
  static async searchPosts(
    search: string,
    page: number = 10,
  ): Promise<LoadArticlePostProperties[]> {
    return await netGet<LoadArticlePostProperties[]>(
      WordPressAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: {
          orderby: "relevance",
          search: encodeURIComponent(search),
          page: page,
        },
      },
    );
  }

  /**
   * Get a single post by slug.
   */
  static async getPost(
    slug: string,
  ): Promise<LoadArticlePostProperties | undefined> {
    const posts = await netGet<LoadArticlePostProperties[]>(
      WordPressAPI.client,
      `/wp-json/wp/v2/posts`,
      {
        params: {
          slug: encodeURIComponent(slug),
        },
      },
    );
    return posts[0] ?? undefined;
  }

  /**
   * Get the feature image.
   */
  static async getFeatureImage(
    href: string,
  ): Promise<{ image: string | undefined; thumb: string | undefined }> {
    const data = await netGet<MediaResponse>(WordPressAPI.client, href);
    const sizes = data?.media_details?.sizes;
    const image = sizes?.medium_large?.source_url ?? sizes?.medium?.source_url;
    const thumb = sizes?.thumbnail?.source_url;
    return { image, thumb };
  }

  /**
   * Convert loaded article properties to ArticleProps.
   */
  static convertLoadProps(data: LoadArticlePostProperties): ArticleProperties {
    const description = data.yoast_head_json?.description ?? "";
    const title = decode(data.title.rendered);
    return { ...data, title, description };
  }
}
