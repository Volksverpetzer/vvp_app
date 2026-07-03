import { useCallback } from "react";

import Loader from "#/components/loader/Loader";
import ArticlePost from "#/components/posts/ArticlePost";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties, HttpsUrl } from "#/types";

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
};

/**
 * This component takes an article slug, pulls WordPress API and then Renders an Article Post with the Response
 */
const LoadArticlePost = (properties: LoadProperties) => {
  const { slug, baseUrl, inView = true, elevated } = properties;

  const loadArticle = useCallback(
    (articleSlug: string) => {
      const getPost = baseUrl
        ? WordPressAPI.create(baseUrl).getPost
        : WordPressAPI.getPost;
      return getPost(articleSlug).then((data) => {
        if (!data) {
          return Promise.reject(
            new Error(`Article not found for slug: ${articleSlug}`),
          );
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
      loadingText="Lade Artikel..."
    />
  );
};

export default LoadArticlePost;
