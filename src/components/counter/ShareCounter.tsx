import { useCallback, useEffect, useState } from "react";
import type { TextStyle } from "react-native";

import { ShareIcon } from "#/components/Icons";
import View from "#/components/design/View";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { getShares } from "#/helpers/network/Engagement";
import useAnalyticsEnabled from "#/hooks/useAnalyticsEnabled";
import type { ShareableType } from "#/types";

interface ShareCounterProperties {
  shareable: ShareableType[];
  style: TextStyle;
  shares?: number;
  color?: string;
  size?: number;
  hideCount?: boolean;
  onPress?: () => void;
}

const ShareCounter = (properties: ShareCounterProperties) => {
  const [shares, setShares] = useState(0);
  const { color, size = 30, hideCount, onPress } = properties;
  const analyticsEnabled = useAnalyticsEnabled();

  const getAllShares = useCallback(async () => {
    let _shares = 0;
    for (const shareable of properties.shareable) {
      _shares = _shares + ((await getShares(shareable.url)) ?? 0);
    }
    setShares(_shares);
  }, [properties.shareable]);

  useEffect(() => {
    if (!analyticsEnabled) return;
    if (hideCount) return;
    getAllShares();
  }, [analyticsEnabled, getAllShares, hideCount]);

  if (!analyticsEnabled) return <View />;

  const hideCountResolved = hideCount;

  const content = (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        gap: 5,
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
