import ArticlePost from "#/components/posts/ArticlePost";
import Post from "#/helpers/Post";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties, LoadArticlePostProperties } from "#/types";

type WpApi = {
  getPosts(page?: number): Promise<LoadArticlePostProperties[]>;
  searchPosts(
    search: string,
    page?: number,
  ): Promise<LoadArticlePostProperties[]>;
};

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
   * Creates a feed/search fetcher pair for any WordPress-compatible API.
   * Pass sourceName to stamp a source label on every returned article.
   */
  createFetchers(api: WpApi, sourceName?: string) {
    const stamp = (posts: Post<{ article: ArticleProperties }>[]) => {
      if (sourceName) {
        posts.forEach((p) => {
          p.data.article.sourceName = sourceName;
        });
      }
      return posts;
    };

    return {
      feedFetcher: async ({ page = 1 }) =>
        stamp(await WordPressFetcher.wpBaseFetcher(() => api.getPosts(page))),
      searchFetcher: async ({ param: parameter = "" }) =>
        stamp(
          await WordPressFetcher.wpBaseFetcher(() =>
            api.searchPosts(parameter),
          ),
        ),
    };
  },
};
