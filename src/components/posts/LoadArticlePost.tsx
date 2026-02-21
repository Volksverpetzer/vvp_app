import { useEffect, useState } from "react";

import UiSpinner from "#/components/animations/UiSpinner";
import WordPressAPI from "#/helpers/network/WordPressAPI";

import ArticlePost, { ArticleProperties } from "./ArticlePost";

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
  const [article, setArticle] = useState<ArticleProperties>();
  const [isLoading, setLoading] = useState(true);
  const { slug } = properties;

  useEffect(() => {
    WordPressAPI.getPost(slug)
      .then((data: LoadArticlePostProperties) => {
        const article = WordPressAPI.convertLoadProps(data);
        setArticle(article);
        setLoading(false);
      })
      .catch((error) => console.error(error));
  }, [slug]);

  if (isLoading) {
    return <UiSpinner />;
  }

  return <ArticlePost inView={true} article={article} />;
};

export default LoadArticlePost;
