import ArticlePost from "#/components/posts/ArticlePost";
import Post from "#/helpers/Post";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties, LoadArticlePostProperties } from "#/types";

type WpApi = {
  getPosts(
    page?: number,
    signal?: AbortSignal,
  ): Promise<LoadArticlePostProperties[]>;
  searchPosts(
    search: string,
    page?: number,
    signal?: AbortSignal,
  ): Promise<LoadArticlePostProperties[]>;
};

export const WordPressFetcher = {
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
      feedFetcher: async ({
        page = 1,
        signal,
      }: { page?: number; signal?: AbortSignal } = {}) =>
        stamp(
          await WordPressFetcher.wpBaseFetcher(
            (sig) => api.getPosts(page, sig),
            signal,
          ),
        ),
      searchFetcher: async ({
        param: parameter = "",
        page = 1,
        signal,
      }: { param?: string; page?: number; signal?: AbortSignal } = {}) =>
        stamp(
          await WordPressFetcher.wpBaseFetcher(
            (sig) => api.searchPosts(parameter, page, sig),
            signal,
          ),
        ),
    };
  },
};
