import { type StyleProp, type TextStyle, View } from "react-native";

import { ShareIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import { getShares } from "#/helpers/network/Engagement";
import { useEngagementCount } from "#/hooks/useEngagementCount";
import type { ShareableType } from "#/types";

interface ShareCounterProperties {
  shareable: ShareableType[];
  style: StyleProp<TextStyle>;
  shares?: number;
  color?: string;
  size?: number;
  hideCount?: boolean;
  onPress?: () => void;
}

const ShareCounter = (properties: ShareCounterProperties) => {
  const { color, size = 20, hideCount, onPress } = properties;
  const shares = useEngagementCount(
    properties.shareable,
    getShares,
    !hideCount,
  );

  const hideCountResolved = hideCount || !Config.enableEngagement;

  const content = (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      <ShareIcon size={size} color={color} />
      <UiText
        style={[properties.style, { opacity: hideCountResolved ? 0 : 1 }]}
        accessibilityElementsHidden={hideCountResolved}
        importantForAccessibility={hideCountResolved ? "no" : "auto"}
      >
        {shares + (properties.shares ?? 0)}
      </UiText>
    </View>
  );

  if (!onPress) return content;

  return (
    <UiPressable
      accessibilityRole="button"
      accessibilityLabel="Teilen"
      onPress={onPress}
      onLongPress={onPress}
      hitSlop={20}
      style={{ flexDirection: "row", justifyContent: "flex-start" }}
    >
      {content}
    </UiPressable>
  );
};

export default ShareCounter;
