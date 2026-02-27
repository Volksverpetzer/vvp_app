import { decode } from "html-entities";

import type { LoadArticlePostProperties } from "#/components/loader/LoadArticlePost";
import ArticlePost, { ArticleProperties } from "#/components/posts/ArticlePost";
import Post from "#/helpers/Post";
import WordPressAPI from "#/helpers/network/WordPressAPI";

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
    article.description = article.yoast_head_json?.description ?? "";
    const title = decode(article.title?.rendered ?? "");
    const formattedArticle: ArticleProperties = { ...article, title };

    return new Post<{ article: ArticleProperties }>(
      article.date_gmt,
      article.slug,
      ArticlePost,
      { article: formattedArticle },
      [{ url: article.link, title: "Artikel teilen" }],
      index === 0 ? 2 : 1,
      undefined,
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
    api: () => Promise<LoadArticlePostProperties[]>,
  ): Promise<Post<{ article: ArticleProperties }>[]> {
    try {
      const data = await api();
      return data.map((article, index) =>
        WordPressFetcher.mapArticleToPost(
          article as LoadArticlePostProperties,
          index,
        ),
      );
    } catch (error) {
      console.error("WP Error:", error);
      return [];
    }
  },

  /**
   * Fetches posts from WordPress
   * @param page The page number to fetch (pagination)
   * @returns An array of posts.
   */
  feedFetcher: async ({ page = 1 }) => {
    return await WordPressFetcher.wpBaseFetcher(() =>
      WordPressAPI.getPosts(page),
    );
  },

  /**
   * Fetches posts from WordPress based on a search parameter.
   * @param param The search parameter.
   * @returns An array of posts.
   */
  searchFetcher: async ({ param: parameter = "" }) => {
    return await WordPressFetcher.wpBaseFetcher(() =>
      WordPressAPI.searchPosts(parameter),
    );
  },
};
