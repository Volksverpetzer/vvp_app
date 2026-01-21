import { decode } from "html-entities";

import ArticlePost, {
  ArticleProperties,
} from "../../../components/posts/ArticlePost";
import { LoadArticlePostProperties } from "../../../components/posts/LoadArticlePost";
import WordpressAPI from "../../../helpers/Networking/WordpressAPI";
import Post from "../../../helpers/Post";

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
      WordpressAPI.getPosts(page),
    );
  },

  /**
   * Fetches posts from WordPress based on a search parameter.
   * @param param The search parameter.
   * @returns An array of posts.
   */
  searchFetcher: async ({ param: parameter = "" }) => {
    return await WordPressFetcher.wpBaseFetcher(() =>
      WordpressAPI.searchPosts(parameter),
    );
  },
};
