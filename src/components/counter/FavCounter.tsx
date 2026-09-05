import type { StyleProp, TextStyle } from "react-native";
import { View } from "react-native";

import { StarIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import { getFavs } from "#/helpers/network/Engagement";
import { useCorporateColor } from "#/hooks/useAppColorScheme";
import { useEngagementCount } from "#/hooks/useEngagementCount";
import { useFavorite } from "#/hooks/useFavorite";
import type { FavPayload, FaveableType, ShareableType } from "#/types";

interface FavCounterProperties {
  shareable: ShareableType[];
  size?: number;
  style: StyleProp<TextStyle>;
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  favPayload?: FavPayload;
}

const FavCounter = (properties: FavCounterProperties) => {
  const color = useCorporateColor();
  const {
    contentFavIdentifier,
    contentType,
    favPayload,
    shareable,
    size = 20,
  } = properties;
  const { isFav, toggleFavorite } = useFavorite(
    contentFavIdentifier,
    contentType,
    shareable[0]?.url,
    favPayload,
  );
  const favs = useEngagementCount(shareable, getFavs);

  if (!Config.enableEngagement) return <View />;

  return (
    <UiPressable
      accessibilityRole="button"
      onPress={toggleFavorite}
      hitSlop={20}
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      <StarIcon filled={isFav} color={color} size={size} />
      <UiText style={properties.style}>{(isFav ? 1 : 0) + favs}</UiText>
    </UiPressable>
  );
};

export default FavCounter;
