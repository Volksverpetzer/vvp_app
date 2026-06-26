import BaseStore from "#/helpers/Storage";
import { normalizedHostOf } from "#/helpers/utils/host";
import type {
  ArticleProperties,
  BlueskyPostProperties,
  InstaPostProperties,
} from "#/types";

const ContentStore = {
  contentKeyPrefix: "content_",

  /**
   * Storage key for an article. Includes the article's site host so that the
   * same slug published on two different WordPress sites (primary + a feed
   * like pruefpunkt.org) maps to separate cache entries instead of colliding.
   */
  articleKey(slug: string, host?: string): string {
    return `${this.contentKeyPrefix}${host ? `${host}_` : ""}${slug}`;
  },

  /**
   * Retrieves an article by its slug and site host.
   * @param slug
   * @param host normalized site host (e.g. "pruefpunkt.org")
   * @returns
   */
  async getStoredArticle(
    slug: string,
    host?: string,
  ): Promise<ArticleProperties | undefined> {
    try {
      const storedArticleJson = await BaseStore.getItem(
        this.articleKey(slug, host),
      );
      return BaseStore.parseJSON(storedArticleJson);
    } catch (error) {
      console.error("Error retrieving stored article:", error);
      return undefined;
    }
  },

  /**
   * References an article by its slug. The site host is derived from the
   * article's own link so it lands under the same key the reader looks up.
   * @param slug
   * @param article
   * @returns
   */
  async setStoredArticle(
    slug: string,
    article: ArticleProperties,
  ): Promise<void> {
    try {
      await BaseStore.setItem(
        this.articleKey(slug, normalizedHostOf(article.link)),
        JSON.stringify(article),
      );
    } catch (error) {
      console.error("Error saving article:", error);
    }
  },

  /**
   * Retrieves an Instagram post by its ID.
   * @param post_id
   * @returns
   */
  async getStoredInstaPost(
    post_id: string,
  ): Promise<InstaPostProperties | undefined> {
    try {
      const storedPostJson = await BaseStore.getItem(
        this.contentKeyPrefix + post_id,
      );
      return BaseStore.parseJSON(storedPostJson);
    } catch (error) {
      console.error("Error retrieving stored post:", error);
      return undefined;
    }
  },

  /**
   * References an Instagram post by its ID.
   * @param post_id
   * @param post
   * @returns
   */
  async setStoredInstaPost(
    post_id: string,
    post: InstaPostProperties,
  ): Promise<void> {
    try {
      await BaseStore.setItem(
        this.contentKeyPrefix + post_id,
        JSON.stringify(post),
      );
    } catch (error) {
      console.error("Error saving post:", error);
    }
  },

  /**
   * References a Bluesky post by its ID, which is the last part of the URI.
   * @param post_id
   * @param post
   * @returns
   */
  async setStoredBskyPostById(
    post_id: string,
    post: BlueskyPostProperties,
  ): Promise<void> {
    try {
      await BaseStore.setItem(
        this.contentKeyPrefix + post_id,
        JSON.stringify(post),
      );
    } catch (error) {
      console.error("Error saving post:", error);
    }
  },

  /**
   * Retrieves a Bluesky post by its ID, which is the last part of the URI.
   * @param post_id
   * @returns
   */
  async getStoredBskyPostById(
    post_id: string,
  ): Promise<BlueskyPostProperties | undefined> {
    try {
      const storedPostJson = await BaseStore.getItem(
        this.contentKeyPrefix + post_id,
      );
      return BaseStore.parseJSON(storedPostJson);
    } catch (error) {
      console.error("Error retrieving stored post:", error);
      return undefined;
    }
  },

  /**
   * Removes all Bluesky posts from AsyncStorage.
   * @returns
   */
  async removeStoredBskyPosts(): Promise<void> {
    try {
      await BaseStore.removePrefixedItems(this.contentKeyPrefix);
    } catch (error) {
      console.error("Error removing stored posts:", error);
    }
  },

  /**
   * Clear all stored content.
   */
  async clear(): Promise<void> {
    try {
      await BaseStore.removePrefixedItems(this.contentKeyPrefix);
    } catch (error) {
      console.error("Error clearing stored content:", error);
    }
  },
};

export default ContentStore;
