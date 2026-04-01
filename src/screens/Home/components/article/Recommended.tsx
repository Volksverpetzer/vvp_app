import { useEffect, useState } from "react";

import View from "#/components/design/View";
import LoadArticlePost from "#/components/loader/LoadArticlePost";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import IntelligenceAPI from "#/helpers/network/IntelligenceAPI";
import type { HttpsUrl } from "#/types";

type RecommendedProperties = {
  article_link: HttpsUrl;
};

/**
 * Recommended component displays a list of recommended articles based on the current article's slug.
 * Fetches recommendations from the API and renders them as article posts.
 *
 * @returns A React fragment with the recommended articles list.
 * @param properties
 */
const Recommended = (properties: RecommendedProperties) => {
  const [matches, setMatches] = useState<{ url: string; title: string }[]>([]);
  const { article_link } = properties;

  useEffect(() => {
    IntelligenceAPI.recommendations(article_link).then((data) => {
      setMatches(data.results);
    });
  }, [article_link]);

  return (
    <>
      {matches.length > 0 && (
        <UiText
          style={{
            padding: 10,
            fontSize: 20,
            fontFamily: "SourceSansProBold",
          }}
        >
          Passend dazu:
        </UiText>
      )}
      {matches?.map((match, index) => {
        if (!match.url.includes(Config.wpUrl)) {
          return null;
        }
        const url = new URL(match.url);
        const path = url.pathname;
        const slug = path.replace(/\/+$/, "").split("/").pop();
        return (
          <View key={String(index)} style={{ margin: 12 }}>
            <LoadArticlePost slug={slug} elevated />
          </View>
        );
      })}
    </>
  );
};

export default Recommended;
