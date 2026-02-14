import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { View } from "react-native";

import { Share } from "#/components/Icons";
import ShareCounter from "#/components/counter/ShareCounter";
import ViewCounter from "#/components/counter/ViewCounter";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";

interface ArticleStatsProperties {
  article_link: string;
}

const ArticleStats = (properties: ArticleStatsProperties) => {
  useKeepAwake();

  const { article_link } = properties;
  const color = Colors["light"].tint;

  if (!Config.analytics) return undefined;

  return (
    <View
      style={{
        paddingHorizontal: 20,
        ...styles.row,
        justifyContent: "flex-start",
      }}
    >
      <MaterialCommunityIcons name="eye-outline" size={20} color={color} />
      <ViewCounter
        {...{ url: article_link }}
        color={color}
        style={{ fontSize: 16, paddingHorizontal: 5 }}
      />
      <Share color={color} />
      <ShareCounter
        style={{ color, fontSize: 16, paddingHorizontal: 5 }}
        shareable={[{ title: "Link teilen", url: article_link }]}
      />
    </View>
  );
};

export default ArticleStats;
