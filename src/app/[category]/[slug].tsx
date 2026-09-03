import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import UiSpinner from "#/components/ui/UiSpinner";
import Config from "#/constants/Config";
import ContentStore from "#/helpers/Stores/ContentStore";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { normalizedHostOf } from "#/helpers/utils/host";
import EdgelessWebview from "#/screens/Home/components/EdgelessWebview";
import ArticleScreen from "#/screens/Home/components/article/Article";
import type { ArticleProperties, HttpsUrl, ImageCredit } from "#/types";

type LoadArticleParameters = {
  imageUrl?: string;
  slug: string;
  category?: string;
  originalUrl?: string;
  // Expo Router exposes the URL fragment (…/#quellen) as the `#` param.
  "#"?: string;
};

/**
 * Loads an article based on the provided slug.
 */
const LoadArticle = () => {
  const parameters = useLocalSearchParams<LoadArticleParameters>();
  const wpUrl = Config.wpUrl;
  // useLocalSearchParams already ran decodeURIComponent on every param, so
  // `anchor` is the decoded fragment — decoding again here would corrupt ids
  // that legitimately contain `%`. Re-encode only when rebuilding a URL.
  const { slug, category, originalUrl, "#": anchor } = parameters;
  const anchorSuffix = anchor ? `#${encodeURIComponent(anchor)}` : "";

  // A WordPress feed entry from a different site than the primary one whose
  // host matches the original URL; articles from there need their own API.
  const secondaryWp = useMemo(
    () => findSecondaryWpFeed(originalUrl, wpUrl, Config.feeds?.wp),
    [originalUrl, wpUrl],
  );

  const secondaryApi = useMemo(
    () => (secondaryWp ? WordPressAPI.create(secondaryWp.handle) : null),
    [secondaryWp],
  );

  const [article, setArticle] = useState<ArticleProperties | undefined>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageCredit, setImageCredit] = useState<ImageCredit | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchArticle = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setHasError(false);

      try {
        // Look up the cache under the article's own site host so a slug that
        // exists on both the primary and a secondary site can't collide.
        const articleHost = normalizedHostOf(originalUrl ?? wpUrl);
        const articleParameter = await ContentStore.getStoredArticle(
          slug,
          articleHost,
        );
        if (signal.aborted) return;

        if (articleParameter) {
          setArticle(articleParameter);
          setImageUrl(articleParameter.imageUrl || "");
          setImageCredit(articleParameter.imageCredit);
          setIsLoading(false);
          return;
        }

        const _article = secondaryApi
          ? await secondaryApi.getPost(slug, signal)
          : await WordPressAPI.getPost(slug, signal);
        if (signal.aborted) return;
        // No post for this slug — fall back to the webview instead of letting
        // convertLoadProps throw on undefined for control flow.
        if (!_article) {
          setHasError(true);
          setIsLoading(false);
          return;
        }
        const loadedArticle: ArticleProperties =
          WordPressAPI.convertLoadProps(_article);

        // The featured-media link can be absent even when featured_media is
        // set — e.g. WordPress omits it when the attachment itself isn't
        // readable via the REST API. Missing artwork shouldn't fail the
        // whole article load and fall back to the raw webview.
        const featuredMediaHref =
          loadedArticle._links["wp:featuredmedia"]?.[0]?.href;
        const { image, credit } = featuredMediaHref
          ? await WordPressAPI.getFeatureImage(featuredMediaHref, signal)
          : { image: undefined, credit: undefined };

        if (signal.aborted) return;
        setArticle(loadedArticle);
        setImageUrl(image);
        setImageCredit(credit);
        setIsLoading(false);
      } catch (error_) {
        if (signal.aborted) return;
        console.error("Error loading article:", error_);
        setHasError(true);
        setIsLoading(false);
      }
    },
    [slug, secondaryApi, originalUrl, wpUrl],
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
    const baseUrl = secondaryWp?.handle ?? wpUrl;
    // WordPress permalinks are trailing-slash canonical and 404 (no redirect)
    // on the slashless form, so rebuild with a trailing slash. The incoming
    // deep link had one, but expo-router strips it when parsing the param.
    const trimmedBase = baseUrl.replace(/\/+$/, "");
    const trimmedCategory = (category || "").replaceAll(/^\/+|\/+$/g, "");
    // originalUrl is the full deep link and already carries its own fragment.
    const url =
      originalUrl ??
      (trimmedCategory
        ? `${trimmedBase}/${trimmedCategory}/${anchorSuffix}`
        : `${trimmedBase}/${anchorSuffix}`);
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
      imageCredit: imageCredit ?? article.imageCredit,
    };
    return <ArticleScreen article={articleWithImage} anchor={anchor} />;
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
        .map((s) => s.replaceAll(/^\/+|\/+$/g, ""))
        .join("/");
      // Trailing slash to match WordPress's canonical permalink form, which
      // otherwise 404s on the slashless URL (see the !slug branch above).
      return path ? `${trimmedBase}/${path}/` : trimmedBase;
    };

    const cleanPath = buildFallbackUrl(wpUrl, category, slug) + anchorSuffix;
    return <EdgelessWebview uri={cleanPath} />;
  }

  // Fallback: Show loading state (shouldn't normally be reached)
  return <UiSpinner text="Lade Artikel..." size="large" />;
};

export default LoadArticle;
