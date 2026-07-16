import { useKeepAwake } from "expo-keep-awake";
import { View } from "react-native";

import { ClockIcon } from "#/components/Icons";
import ShareCounter from "#/components/counter/ShareCounter";
import ViewCounter from "#/components/counter/ViewCounter";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import type { HttpsUrl } from "#/types";

interface ArticleStatsProperties {
  article_link: HttpsUrl;
  reading_time?: number;
}

const ArticleStats = (properties: ArticleStatsProperties) => {
  useKeepAwake();

  const { article_link, reading_time } = properties;
  const color = useCorporateColor();
  const showEngagement = Config.enableEngagement;

  if (!showEngagement && !reading_time) return null;

  return (
    <View
      style={[
        globalStyles.row,
        { paddingHorizontal: 20, justifyContent: "flex-start", gap: 20 },
      ]}
    >
      {!!reading_time && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <ClockIcon size={16} color={color} />
          <UiText size="base" style={{ color }}>
            {reading_time} Min.
          </UiText>
        </View>
      )}
      {showEngagement && (
        <>
          <ViewCounter
            {...{ url: article_link }}
            color={color}
            style={{ fontSize: 16 }}
            size={16}
          />
          <ShareCounter
            style={{ fontSize: 16, color }}
            shareable={[{ title: "Link teilen", url: article_link }]}
            color={color}
            size={16}
          />
        </>
      )}
    </View>
  );
};

export default ArticleStats;
