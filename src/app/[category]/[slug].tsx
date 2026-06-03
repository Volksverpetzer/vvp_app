import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import ContentStore from "#/helpers/Stores/ContentStore";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import EdgelessWebview from "#/screens/Home/components/EdgelessWebview";
import ArticleScreen from "#/screens/Home/components/article/Article";
import type { ArticleProperties, HttpsUrl } from "#/types";

type LoadArticleParameters = {
  imageUrl?: string;
  slug: string;
  category?: string;
  originalUrl?: string;
};

/**
 * Loads an article based on the provided slug.
 */
const LoadArticle = () => {
  const parameters = useLocalSearchParams<LoadArticleParameters>();
  const wpUrl = Config.wpUrl;
  const { slug, category, originalUrl } = parameters;

  const wp2Api = useMemo(
    () => (Config.wp2Url ? WordPressAPI.create(Config.wp2Url) : null),
    [],
  );

  const isWp2 = useMemo(() => {
    if (!wp2Api || !originalUrl || !Config.wp2Url) return false;
    const normalizeHost = (url: string) => {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    };
    return normalizeHost(originalUrl) === normalizeHost(Config.wp2Url);
  }, [wp2Api, originalUrl]);

  const [article, setArticle] = useState<ArticleProperties | undefined>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchArticle = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setHasError(false);

      try {
        const articleParameter = await ContentStore.getStoredArticle(slug);
        if (signal.aborted) return;

        if (articleParameter) {
          setArticle(articleParameter);
          setImageUrl(articleParameter.imageUrl || "");
          setIsLoading(false);
          return;
        }

        const _article = isWp2
          ? await wp2Api!.getPost(slug, signal)
          : await WordPressAPI.getPost(slug, signal);
        const loadedArticle: ArticleProperties =
          WordPressAPI.convertLoadProps(_article);

        const { image } = await WordPressAPI.getFeatureImage(
          loadedArticle._links["wp:featuredmedia"][0].href,
          signal,
        );

        if (signal.aborted) return;
        setArticle(loadedArticle);
        setImageUrl(image);
        setIsLoading(false);
      } catch (error_) {
        if (signal.aborted) return;
        console.error("Error loading article:", error_);
        setHasError(true);
        setIsLoading(false);
      }
    },
    [slug, isWp2, wp2Api],
  );

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    void fetchArticle(controller.signal);

    return () => {
      controller.abort();
    };
  }, [slug, fetchArticle]);

  if (!slug) {
    const baseUrl = isWp2 ? Config.wp2Url! : wpUrl;
    const url = originalUrl ?? `${baseUrl}/${category || ""}`;
    return <EdgelessWebview uri={url as HttpsUrl} />;
  }

  // While we're fetching the article show a themed spinner instead of a webview
  if (isLoading) {
    return <UiSpinner text="Lade Artikel..." size="large" />;
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
    if (originalUrl) {
      return <EdgelessWebview uri={originalUrl as HttpsUrl} />;
    }

    // Safely build the URL without collapsing the protocol slashes
    const buildFallbackUrl = (
      base: string,
      ...segments: (string | undefined)[]
    ) => {
      const trimmedBase = base.replace(/\/+$/, "");
      const path = segments
        .filter((s): s is string => Boolean(s))
        .map((s) => s.replace(/^\/+|\/+$/g, ""))
        .join("/");
      return path ? `${trimmedBase}/${path}` : trimmedBase;
    };

    const cleanPath = buildFallbackUrl(wpUrl, category, slug);
    return <EdgelessWebview uri={cleanPath} />;
  }

  // Fallback: Show loading state (shouldn't normally be reached)
  return <UiSpinner text="Lade Artikel..." size="large" />;
};

export default LoadArticle;
