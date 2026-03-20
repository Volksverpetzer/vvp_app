import { useCallback, useEffect, useState } from "react";
import { Pressable, type TextStyle, View } from "react-native";

import { ShareIcon } from "#/components/Icons";
import Text from "#/components/design/Text";
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
  const { color, size = 30, hideCount, onPress } = properties;

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

  if (!Config.enableEngagement) return <View />;

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
      <Text
        style={[properties.style, { opacity: hideCount ? 0 : 1 }]}
        accessibilityElementsHidden={hideCount}
        importantForAccessibility={hideCount ? "no" : "auto"}
      >
        {shares + (properties.shares ?? 0)}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
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
