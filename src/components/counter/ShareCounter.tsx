import { useCallback, useEffect, useState } from "react";
import type { TextStyle } from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Config from "#/constants/Config";
import type { ShareableType } from "#/helpers/Sharing";
import { getShares } from "#/helpers/network/Analytics";

interface ShareCounterProperties {
  shareable: ShareableType[];
  style: TextStyle;
  shares?: number;
}

const ShareCounter = (properties: ShareCounterProperties) => {
  const [shares, setShares] = useState(0);

  const getAllShares = useCallback(async () => {
    let _shares = 0;
    for (const shareable of properties.shareable) {
      _shares = _shares + ((await getShares(shareable.url)) ?? 0);
    }
    setShares(_shares);
  }, [properties.shareable]);

  useEffect(() => {
    if (!Config.analytics) return;
    getAllShares();
  }, [getAllShares]);

  if (!Config.analytics) return <View />;

  return (
    <Text style={properties.style}>{shares + (properties.shares ?? 0)}</Text>
  );
};

export default ShareCounter;
