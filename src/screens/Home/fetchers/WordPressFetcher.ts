import ArticlePost from "#/components/posts/ArticlePost";
import Post from "#/helpers/Post";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties, LoadArticlePostProperties } from "#/types";

export const WordPressFetcher = {
  /**
   * Maps a WordPress article to a Post object.
   * @param article The article to map.
   * @param index The index of the article.
   * @returns The mapped Post object.
   */
  mapArticleToPost(
    article: LoadArticlePostProperties,
    index: number,
  ): Post<{ article: ArticleProperties }> {
    const formattedArticle = WordPressAPI.convertLoadProps(article);

    return new Post<{ article: ArticleProperties }>(
      article.date_gmt,
      article.slug,
      ArticlePost,
      { article: formattedArticle },
      [{ url: article.link, title: "Artikel teilen" }],
      index === 0 ? 2 : 1,
      article.slug,
      "article",
    );
  },

  /**
   * Fetches posts from WordPress
   * @param api The API function to use.
   * @returns An array of posts.
   */
  async wpBaseFetcher(
    api: (signal?: AbortSignal) => Promise<LoadArticlePostProperties[]>,
    signal?: AbortSignal,
  ): Promise<Post<{ article: ArticleProperties }>[]> {
    try {
      const data = await api(signal);
      return data.map((article, index) =>
        WordPressFetcher.mapArticleToPost(
          article as LoadArticlePostProperties,
          index,
        ),
      );
    } catch (error) {
      if (!signal?.aborted) {
        console.error("WP Error:", error);
      }
      return [];
    }
  },

  /**
   * Fetches posts from WordPress
   * @param page The page number to fetch (pagination)
   * @returns An array of posts.
   */
  feedFetcher: async ({
    page = 1,
    signal,
  }: { page?: number; signal?: AbortSignal } = {}) => {
    return await WordPressFetcher.wpBaseFetcher(
      (_signal) => WordPressAPI.getPosts(page, _signal),
      signal,
    );
  },

  /**
   * Fetches posts from WordPress based on a search parameter.
   * @param param The search parameter.
   * @returns An array of posts.
   */
  searchFetcher: async ({
    param: parameter = "",
    signal,
  }: { param?: string; signal?: AbortSignal } = {}) => {
    return await WordPressFetcher.wpBaseFetcher(
      (_signal) => WordPressAPI.searchPosts(parameter, 10, _signal),
      signal,
    );
  },
};
