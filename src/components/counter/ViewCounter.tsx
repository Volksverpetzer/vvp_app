import { useEffect, useState } from "react";
import type { ColorValue } from "react-native";
import { ActivityIndicator } from "react-native";

import Text from "#/components/design/Text";
import Config from "#/constants/Config";
import { getViews } from "#/helpers/network/Analytics";

interface ViewCounterProperties {
  url: string; // the URL for which to fetch the views
  color?: ColorValue;
  style?: any;
}

/**
 * Renders View Counter for a given URL
 */
const ViewCounter = (properties: ViewCounterProperties) => {
  const [isLoading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const color = properties?.color ?? "#fff";

  useEffect(() => {
    if (!Config.enableFavorites) return;
    getViews(properties.url).then((views) => {
      //console.log(views)
      setViews(views);
      setLoading(false);
    });
  });
  if (!Config.enableFavorites) return;

  // TODO replace ActivityIndicator with UiSpinner and adjust styling
  return (
    <>
      {isLoading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text
          style={{
            color: color,
            fontSize: 14,
            ...properties.style,
          }}
        >
          {views.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".")}
        </Text>
      )}
    </>
  );
};

export default ViewCounter;
