import { useCallback } from "react";

import Loader from "#/components/loader/Loader";
import ArticlePost from "#/components/posts/ArticlePost";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import type { ArticleProperties } from "#/types";

export type LoadProperties = {
  slug: string;
  inView?: boolean;
};

/**
 * This component takes an article slug, pulls WordPress API and then Renders an Article Post with the Response
 */
const LoadArticlePost = (properties: LoadProperties) => {
  const { slug, inView = true } = properties;

  const loadArticle = useCallback((articleSlug: string) => {
    return WordPressAPI.getPost(articleSlug).then((data) => {
      if (!data) {
        return Promise.reject(
          new Error(`Article not found for slug: ${articleSlug}`),
        );
      }

      return WordPressAPI.convertLoadProps(data);
    });
  }, []);

  const renderArticle = useCallback(
    (article: ArticleProperties) => (
      <ArticlePost inView={inView} article={article} />
    ),
    [inView],
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
