import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import AnimatedLoading from "#/components/animations/AnimatedLoading";
import View from "#/components/design/View";
import { ArticleProperties } from "#/components/posts/ArticlePost";
import Config from "#/constants/Config";
import ContentStore from "#/helpers/Stores/ContentStore";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import EdgelessWebview from "#/screens/Home/components/EdgelessWebview";
import ArticleScreen from "#/screens/Home/components/article/Article";

type LoadArticleParameters = {
  imageUrl?: string;
  slug: string;
  category?: string;
};

/**
 * Loads an article based on the provided slug.
 */
const LoadArticle = () => {
  const parameters = useLocalSearchParams<LoadArticleParameters>();
  const wpUrl = Config.wpUrl;
  const { slug, category } = parameters;
  const [article, setArticle] = useState<ArticleProperties | undefined>();
  const [imageUrl, setImageUrl] = useState<string>("");

  /**
   * Loads an article based on the provided slug.
   */
  const loadArticle = async () => {
    try {
      if (!slug) {
        // If no slug is provided, render the EdgelessWebview with the base URL
        console.warn("No slug provided, rendering EdgelessWebview");
        return;
      }

      const articleParameter = await ContentStore.getStoredArticle(slug);
      if (articleParameter) {
        setArticle(articleParameter);
        setImageUrl(articleParameter.imageUrl || "");
      } else {
        const _article = await WordPressAPI.getPost(slug);
        const loadedArticle: ArticleProperties =
          WordPressAPI.convertLoadProps(_article);
        const { image } = await WordPressAPI.getFeatureImage(
          loadedArticle._links["wp:featuredmedia"][0].href,
        );
        setArticle(loadedArticle);
        setImageUrl(image);
      }
    } catch (error_) {
      console.error("Error loading article:", error_);
      console.warn("Failed to load article, falling back to EdgelessWebview");
      // Render the EdgelessWebview with the article URL
      const url = `${wpUrl}/${category || ""}/${slug || ""}`;
      return <EdgelessWebview uri={url} />;
    }
  };

  useEffect(() => {
    loadArticle();
  }, [slug]);

  if (!slug) {
    // If no slug is provided, render the EdgelessWebview
    const url = `${wpUrl}/${category || ""}`;
    return <EdgelessWebview uri={url} />;
  }

  // If we have an article, render it with the ArticleScreen
  if (article) {
    // Create a new article object with the image URL included
    const articleWithImage = {
      ...article,
      imageUrl: imageUrl || article.imageUrl || "",
    };
    return <ArticleScreen article={articleWithImage} />;
  }

  // If we have a slug but no article, show the webview
  if (slug) {
    // Safely build the URL without collapsing the protocol slashes
    const buildUrl = (base: string, ...segments: (string | undefined)[]) => {
      const trimmedBase = base.replace(/\/+$/, "");
      const path = segments
        .filter(Boolean)
        .map((s) => (s as string).replace(/^\/+|\/+$/g, ""))
        .join("/");
      return path ? `${trimmedBase}/${path}` : trimmedBase;
    };

    const cleanPath = buildUrl(wpUrl, category, slug);
    return <EdgelessWebview uri={cleanPath} />;
  }

  // Fallback: Show loading state
  return (
    <View style={{ justifyContent: "center", height: "100%" }}>
      <AnimatedLoading />
      <Text style={{ textAlign: "center" }}>Lade Artikel...</Text>
    </View>
  );
};

export default LoadArticle;
