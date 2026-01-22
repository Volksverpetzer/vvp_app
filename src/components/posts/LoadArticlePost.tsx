import { useEffect, useState } from "react";

import AnimatedLoading from "#/components/animations/AnimatedLoading";
import WordpressAPI from "#/helpers/Networking/WordpressAPI";

import ArticlePost, { ArticleProperties } from ".//ArticlePost";

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
 * This component takes an article slug, pulls Wordpress API and then Renders an Article Post with the Response
 */
const LoadArticlePost = (properties: LoadProperties) => {
  const [article, setArticle] = useState<ArticleProperties>();
  const [isLoading, setLoading] = useState(true);
  const { slug } = properties;

  useEffect(() => {
    WordpressAPI.getPost(slug)
      .then((data: LoadArticlePostProperties) => {
        const article = WordpressAPI.convertLoadProps(data);
        setArticle(article);
        setLoading(false);
      })
      .catch((error) => console.error(error));
  }, [slug]);

  if (isLoading) {
    return <AnimatedLoading />;
  }

  return <ArticlePost inView={true} article={article} />;
};

export default LoadArticlePost;
