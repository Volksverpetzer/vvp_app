import { useEffect, useState } from "react";
import { TextStyle } from "react-native";

import Text from "#/components/design/Text";
import View from "#/components/design/View";
import Config from "#/constants/Config";
import { ShareableType } from "#/helpers/Sharing";
import { getShares } from "#/helpers/network/Analytics";

interface ShareCounterProperties {
  shareable: ShareableType[];
  style: TextStyle;
  shares?: number;
}

const ShareCounter = (properties: ShareCounterProperties) => {
  const [shares, setShares] = useState(0);
  useEffect(() => {
    if (!Config.analytics) return;
    getAllShares();
  }, []);

  if (!Config.analytics) return <View />;

  const getAllShares = async () => {
    let _shares = 0;
    for (const shareable of properties.shareable) {
      _shares = _shares + ((await getShares(shareable.url)) ?? 0);
    }
    setShares(_shares);
  };

  return (
    <Text style={properties.style}>{shares + (properties.shares ?? 0)}</Text>
  );
};

export default ShareCounter;
