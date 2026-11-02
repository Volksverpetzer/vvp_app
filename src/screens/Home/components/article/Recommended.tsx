import { useEffect, useState } from "react";
import { View } from "react-native";

import LoadArticlePost from "#/components/loader/LoadArticlePost";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { isSameHost } from "#/helpers/utils/host";
import type { HttpsUrl } from "#/types";

interface RecommendedProperties {
  article_link: HttpsUrl;
}

/**
 * Recommended component displays a list of recommended articles based on the current article's slug.
 * Fetches recommendations from the API and renders them as article posts.
 *
 * Recommendations come from the article's own site (its WordPress feed's
 * `aiSite`), so a Prüfpunkt article recommends Prüfpunkt articles and a
 * Volksverpetzer article Volksverpetzer ones.
 *
 * @returns A React fragment with the recommended articles list.
 * @param properties
 */
const Recommended = (properties: RecommendedProperties) => {
  const [matches, setMatches] = useState<{ url: string; title: string }[]>([]);
  const { article_link } = properties;

  useEffect(() => {
    // Recommendations come from the AI backend; variants without one skip them
    if (!Config.aiUrl) return;
    const controller = new AbortController();

    const site = Config.feeds?.wp?.find((entry) =>
      isSameHost(entry.handle, article_link),
    )?.aiSite;

    IntelligenceAPI.recommendations(article_link, controller.signal, site)
      .then((data) => {
        if (controller.signal.aborted) return;
        setMatches(data.results);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load recommendations:", error);
      });

    return () => {
      controller.abort();
    };
  }, [article_link]);

  if (matches.length === 0) return null;

  return (
    <>
      <UiText
        size="xl"
        bold
        style={{
          padding: spacing.md,
        }}
      >
        Passend dazu:
      </UiText>
      <View style={{ gap: spacing.md, padding: spacing.md }}>
        {matches.map((match, index) => {
          // Load from the site the article lives on: the primary site, or a
          // configured secondary WordPress feed such as Prüfpunkt.
          const secondaryFeed = findSecondaryWpFeed(
            match.url,
            Config.wpUrl,
            Config.feeds?.wp,
          );
          if (!secondaryFeed && !isSameHost(match.url, Config.wpUrl)) {
            return null;
          }
          const url = new URL(match.url);
          const path = url.pathname;
          const slug = path.replace(/\/+$/, "").split("/").pop();
          return (
            <LoadArticlePost
              key={String(index)}
              slug={slug}
              baseUrl={secondaryFeed?.handle}
              elevated
            />
          );
        })}
      </View>
    </>
  );
};

export default Recommended;
