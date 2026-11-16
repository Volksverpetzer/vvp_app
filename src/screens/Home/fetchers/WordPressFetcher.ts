import ArticlePost from "#/components/posts/ArticlePost";
import Post from "#/helpers/Post";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties, LoadArticlePostProperties } from "#/types";

import FetcherUtilities from "./FetcherUtilities";

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
      FetcherUtilities.toFeedDatetime(article.date_gmt),
      article.slug,
      ArticlePost,
      { article: formattedArticle },
      FetcherUtilities.shareLink(article.link, "Artikel teilen"),
      index === 0 ? 2 : 1,
      article.slug,
      "article",
    );
  },

  async wpBaseFetcher(
    api: (signal?: AbortSignal) => Promise<LoadArticlePostProperties[]>,
    signal?: AbortSignal,
    name = "wp",
  ): Promise<Post<{ article: ArticleProperties }>[]> {
    const data = await FetcherUtilities.safeFetch(() => api(signal), name);
    return FetcherUtilities.mapItems(data, name, (article, index) =>
      WordPressFetcher.mapArticleToPost(article, index),
    );
  },

  /**
   * Creates a feed/search fetcher pair for any WordPress-compatible API.
   * Pass sourceName to stamp a source label on every returned article, and
   * feedKey (e.g. "wp:pruefpunkt.org") to name the source in log messages.
   */
  createFetchers(api: WpApi, sourceName?: string, feedKey = "wp") {
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
            feedKey,
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
            `${feedKey}:search`,
          ),
        ),
    };
  },
};
