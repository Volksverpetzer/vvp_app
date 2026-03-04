import { useKeepAwake } from "expo-keep-awake";
import { View } from "react-native";

import { ArticleViewIcon, ShareIcon } from "#/components/Icons";
import ShareCounter from "#/components/counter/ShareCounter";
import ViewCounter from "#/components/counter/ViewCounter";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import type { HttpsUrl } from "#/types";

interface ArticleStatsProperties {
  article_link: HttpsUrl;
}

const ArticleStats = (properties: ArticleStatsProperties) => {
  useKeepAwake();

  const { article_link } = properties;
  const color = Colors["light"].tint;

  if (!Config.enableEngagement) return undefined;

  return (
    <View
      style={{
        paddingHorizontal: 20,
        ...styles.row,
        justifyContent: "flex-start",
      }}
    >
      <ArticleViewIcon size={20} color={color} />
      <ViewCounter
        {...{ url: article_link }}
        color={color}
        style={{ fontSize: 16, paddingHorizontal: 5 }}
      />
      <ShareIcon size={20} color={color} />
      <ShareCounter
        style={{ color, fontSize: 16, paddingHorizontal: 5 }}
        shareable={[{ title: "Link teilen", url: article_link }]}
      />
    </View>
  );
};

export default ArticleStats;
