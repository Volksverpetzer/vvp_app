import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "react-native";

import UiSpinner from "#/components/animations/UiSpinner";
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const mountedRef = useRef(true);

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const articleParameter = await ContentStore.getStoredArticle(slug);
      if (!mountedRef.current) return;

      if (articleParameter) {
        setArticle(articleParameter);
        setImageUrl(articleParameter.imageUrl || "");
        setIsLoading(false);
        return;
      }

      const _article = await WordPressAPI.getPost(slug);
      const loadedArticle: ArticleProperties =
        WordPressAPI.convertLoadProps(_article);

      const { image } = await WordPressAPI.getFeatureImage(
        loadedArticle._links["wp:featuredmedia"][0].href,
      );

      if (!mountedRef.current) return;
      setArticle(loadedArticle);
      setImageUrl(image);
      setIsLoading(false);
    } catch (error_) {
      if (!mountedRef.current) return;
      console.error("Error loading article:", error_);
      setHasError(true);
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    mountedRef.current = true;

    void fetchArticle();

    return () => {
      mountedRef.current = false;
    };
  }, [slug, fetchArticle]);

  if (!slug) {
    // If no slug is provided, render the EdgelessWebview
    const url = `${wpUrl}/${category || ""}`;
    return <EdgelessWebview uri={url} />;
  }

  // While we're fetching the article show a themed spinner instead of a webview
  if (isLoading) {
    return (
      <View style={{ justifyContent: "center", height: "100%" }}>
        <UiSpinner size={"large"} />
        <Text style={{ textAlign: "center" }}>Lade Artikel...</Text>
      </View>
    );
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

  // If fetching failed, fall back to the webview for compatibility
  if (hasError) {
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

  // Fallback: Show loading state (shouldn't normally be reached)
  return (
    <View style={{ justifyContent: "center", height: "100%" }}>
      <UiSpinner size={"large"} />
      <Text style={{ textAlign: "center" }}>Lade Artikel...</Text>
    </View>
  );
};

export default LoadArticle;
