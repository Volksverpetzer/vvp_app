import { useCallback, useEffect, useState } from "react";
import { Pressable, type TextStyle, View } from "react-native";

import { ShareIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { getShares } from "#/helpers/network/Engagement";
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
  const { color, size = 20, hideCount, onPress } = properties;

  const getAllShares = useCallback(async () => {
    let _shares = 0;
    for (const shareable of properties.shareable) {
      _shares = _shares + ((await getShares(shareable.url)) ?? 0);
    }
    setShares(_shares);
  }, [properties.shareable]);

  useEffect(() => {
    if (!Config.enableEngagement) return;
    if (hideCount) return;
    getAllShares();
  }, [getAllShares, hideCount]);

  const hideCountResolved = hideCount || !Config.enableEngagement;

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Teilen"
      onPress={onPress}
      onLongPress={onPress}
      hitSlop={20}
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "flex-start",
        backgroundColor: pressed ? "rgba(120,120,120,0.6)" : undefined,
      })}
    >
      {content}
    </Pressable>
  );
};

export default ShareCounter;
