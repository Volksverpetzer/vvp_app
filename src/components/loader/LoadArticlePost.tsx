import { useCallback } from "react";
import Loader from "src/components/loader/Loader";
import ArticlePost, {
  ArticleProperties,
} from "src/components/posts/ArticlePost";

import WordPressAPI from "#/helpers/network/WordPressAPI";

export type LoadProperties = {
  slug: string;
  inView?: boolean;
};

export type LoadArticlePostProperties = Omit<
  ArticleProperties,
  "title" | "yoast_head_json"
> & {
  title: { rendered: string };
  yoast_head_json: { description: string };
};

/**
 * This component takes an article slug, pulls WordPress API and then Renders an Article Post with the Response
 */
const LoadArticlePost = (properties: LoadProperties) => {
  const { slug } = properties;

  const loadArticle = useCallback((articleSlug: string) => {
    return WordPressAPI.getPost(articleSlug).then(
      (data: LoadArticlePostProperties) => WordPressAPI.convertLoadProps(data),
    );
  }, []);

  const renderArticle = useCallback(
    (article: ArticleProperties) => (
      <ArticlePost inView={true} article={article} />
    ),
    [],
  );

  return (
    <Loader
      keyValue={slug}
      load={loadArticle}
      render={renderArticle}
      loadingText={"Lade Artikel..."}
    />
  );
};

export default LoadArticlePost;
