import type { ArticleProperties } from "#/components/posts/ArticlePost";
import type { BlueskyPostProperties } from "#/components/posts/BlueskyPost";
import type { InstaPostProperties } from "#/components/posts/InstaPost";
import BaseStore from "#/helpers/Storage";

const ContentStore = {
  contentKeyPrefix: "content_",

  /**
   * Retrieves an article by its slug.
   * @param slug
   * @returns
   */
  async getStoredArticle(slug: string): Promise<ArticleProperties | undefined> {
    try {
      const storedArticleJson = await BaseStore.getItem(
        this.contentKeyPrefix + slug,
      );
      return BaseStore.parseJSON(storedArticleJson);
    } catch (error) {
      console.error("Error retrieving stored article:", error);
      return undefined;
    }
  },

  /**
   * References an article by its slug.
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
        this.contentKeyPrefix + slug,
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
