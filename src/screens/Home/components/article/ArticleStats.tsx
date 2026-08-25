import { useKeepAwake } from "expo-keep-awake";
import { View } from "react-native";

import { ClockIcon } from "#/components/Icons";
import ShareCounter from "#/components/counter/ShareCounter";
import ViewCounter from "#/components/counter/ViewCounter";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { fontSizes } from "#/constants/FontSizes";
import { globalStyles } from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
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
        {
          paddingHorizontal: spacing.xl,
          justifyContent: "flex-start",
          gap: spacing.xl,
        },
      ]}
    >
      {!!reading_time && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          <ClockIcon size={iconSizes.xs} color={color} />
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
            style={{ fontSize: fontSizes.base }}
            size={iconSizes.xs}
          />
          <ShareCounter
            style={{ fontSize: fontSizes.base, color }}
            shareable={[{ title: "Link teilen", url: article_link }]}
            color={color}
            size={iconSizes.xs}
          />
        </>
      )}
    </View>
  );
};

export default ArticleStats;
