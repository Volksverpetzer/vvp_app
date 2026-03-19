import { useCallback, useEffect, useState } from "react";
import type { TextStyle } from "react-native";

import { ShareIcon } from "#/components/Icons";
import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Config from "#/constants/Config";
import { getShares } from "#/helpers/network/Engagement";
import type { ShareableType } from "#/types";

interface ShareCounterProperties {
  shareable: ShareableType[];
  style: TextStyle;
  shares?: number;
  color?: string;
  size?: number;
}

const ShareCounter = (properties: ShareCounterProperties) => {
  const [shares, setShares] = useState(0);
  const { color, size = 10 } = properties;

  const getAllShares = useCallback(async () => {
    let _shares = 0;
    for (const shareable of properties.shareable) {
      _shares = _shares + ((await getShares(shareable.url)) ?? 0);
    }
    setShares(_shares);
  }, [properties.shareable]);

  useEffect(() => {
    if (!Config.enableEngagement) return;
    getAllShares();
  }, [getAllShares]);

  if (!Config.enableEngagement) return <View />;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        gap: 5,
      }}
    >
      <ShareIcon size={size} color={color} />
      <Text style={properties.style}>{shares + (properties.shares ?? 0)}</Text>
    </View>
  );
};

export default ShareCounter;
