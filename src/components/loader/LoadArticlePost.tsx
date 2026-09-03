import type { ReactElement } from "react";
import { useCallback } from "react";

import Loader from "#/components/loader/Loader";
import ArticlePost from "#/components/posts/ArticlePost";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties, HttpsUrl } from "#/types";

/**
 * Thrown when `WordPressAPI.getPost` resolves without a post for the given
 * slug — as opposed to a network/server failure, which throws whatever error
 * the fetch layer produced. Callers that want to tell the two apart (e.g. to
 * only show a "not found" fallback for a genuinely missing slug, not mask a
 * transient outage as one) can check `error instanceof ArticleNotFoundError`
 * in `renderError`.
 */
export class ArticleNotFoundError extends Error {
  constructor(slug: string) {
    super(`Article not found for slug: ${slug}`);
    this.name = "ArticleNotFoundError";
  }
}

export type LoadProperties = {
  slug: string;
  /**
   * WordPress base URL to load the article from. Defaults to the primary site;
   * pass a secondary feed's handle (e.g. Prüfpunkt) so an embedded related
   * article resolves against the site it actually lives on.
   */
  baseUrl?: HttpsUrl;
  inView?: boolean;
  elevated?: boolean;
  /**
   * Overrides the default "couldn't load" error card, e.g. to render nothing
   * when a caller would rather silently drop a broken entry (such as a stale
   * recommendation) than show an error in a list of otherwise-fine items.
   * Return `null` to render nothing.
   */
  renderError?: (error: unknown) => ReactElement | null;
};

// Reuse one API client per secondary base URL so rendering many embedded
// articles (or reloading one) doesn't rebuild a fetch client every time.
const secondaryApiCache = new Map<
  HttpsUrl,
  ReturnType<typeof WordPressAPI.create>
>();
const secondaryApiFor = (baseUrl: HttpsUrl) => {
  let api = secondaryApiCache.get(baseUrl);
  if (!api) {
    api = WordPressAPI.create(baseUrl);
    secondaryApiCache.set(baseUrl, api);
  }
  return api;
};

/**
 * This component takes an article slug, pulls WordPress API and then Renders an Article Post with the Response
 */
const LoadArticlePost = (properties: LoadProperties) => {
  const { slug, baseUrl, inView = true, elevated, renderError } = properties;

  const loadArticle = useCallback(
    (articleSlug: string) => {
      const getPost = baseUrl
        ? secondaryApiFor(baseUrl).getPost
        : WordPressAPI.getPost;
      return getPost(articleSlug).then((data) => {
        if (!data) {
          return Promise.reject(new ArticleNotFoundError(articleSlug));
        }

        return WordPressAPI.convertLoadProps(data);
      });
    },
    [baseUrl],
  );

  const renderArticle = useCallback(
    (article: ArticleProperties) => (
      <ArticlePost inView={inView} elevated={elevated} article={article} />
    ),
    [inView, elevated],
  );

  return (
    <Loader
      keyValue={slug}
      load={loadArticle}
      render={renderArticle}
      renderError={renderError}
      loadingText="Lade Artikel..."
    />
  );
};

export default LoadArticlePost;
