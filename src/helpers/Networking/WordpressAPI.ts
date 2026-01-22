import { decode } from "html-entities";

import { ArticleProperties } from "#/components/posts/ArticlePost";
import { LoadArticlePostProperties } from "#/components/posts/LoadArticlePost";
import Config from "#/constants/Config";
import { createClient, get as netGet } from "#/helpers/Networking";

// Define an interface for the media response structure.
interface MediaResponse {
  media_details?: {
    sizes?: {
      medium_large?: { source_url: string };
      medium?: { source_url: string };
      thumbnail?: { source_url: string };
    };
  };
}

export default class WordpressAPI {
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
      WordpressAPI.client,
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
      WordpressAPI.client,
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
      WordpressAPI.client,
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
   * Get the feature image. Accepts an optional default image object.
   */
  static async getFeatureImage(
    href: string,
  ): Promise<{ image: string; thumb: string | undefined }> {
    const defaultImage: MediaResponse = {
      media_details: {
        sizes: {
          medium_large: { source_url: "./assets/loading.jpg" },
          medium: { source_url: "./assets/loading.jpg" },
          thumbnail: { source_url: "./assets/loading.jpg" },
        },
      },
    };
    const data = await netGet<MediaResponse>(WordpressAPI.client, href);
    const sizes = data?.media_details?.sizes;
    const image =
      sizes?.medium_large?.source_url ??
      sizes?.medium?.source_url ??
      defaultImage.media_details.sizes.medium_large.source_url;
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
