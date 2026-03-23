import { useKeepAwake } from "expo-keep-awake";
import { View } from "react-native";

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
        gap: 20,
      }}
    >
      <ViewCounter
        {...{ url: article_link }}
        color={color}
        style={{ fontSize: 16 }}
        size={16}
      />
      <ShareCounter
        style={{ fontSize: 16, color: color }}
        shareable={[{ title: "Link teilen", url: article_link }]}
        color={color}
        size={16}
      />
    </View>
  );
};

export default ArticleStats;
