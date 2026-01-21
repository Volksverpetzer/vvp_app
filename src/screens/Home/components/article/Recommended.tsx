import { useEffect, useState } from "react";

import Text from "../../../../components/design/Text";
import View from "../../../../components/design/View";
import LoadArticlePost from "../../../../components/posts/LoadArticlePost";
import Config from "../../../../constants/Config";
import { styles } from "../../../../constants/Styles";
import IntelligenceAPI from "../../../../helpers/Networking/IntelligenceAPI";

/**
 * Recommended component displays a list of recommended articles based on the current article's slug.
 * Fetches recommendations from the API and renders them as article posts.
 *
 * @param props - Object containing the slug of the current article.
 * @returns A React fragment with the recommended articles list.
 */
const Recommended = (properties: { article_link }) => {
  const [matches, setMatches] = useState<{ url: string; title: string }[]>([]);
  const { article_link } = properties;

  useEffect(() => {
    IntelligenceAPI.recommendations(article_link).then((data) => {
      setMatches(data.results);
    });
  }, [article_link]);

  return (
    <>
      <Text style={{ padding: 10, fontSize: 18 }}>Passend dazu:</Text>
      {matches?.map((match, index) => {
        if (!match.url.includes(Config.wpUrl)) {
          return;
        }
        const url = new URL(match.url);
        const path = url.pathname;
        const slug = path.replace(/\/+$/, "").split("/").pop();
        return (
          <View
            key={String(index)}
            style={{ ...styles.roundEdges, margin: 12 }}
          >
            <LoadArticlePost slug={slug} />
          </View>
        );
      })}
    </>
  );
};

export default Recommended;
