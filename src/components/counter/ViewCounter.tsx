import { useEffect, useState } from "react";
import type { ColorValue, TextStyle } from "react-native";
import { ActivityIndicator } from "react-native";

import Text from "#/components/design/Text";
import Config from "#/constants/Config";
import { getViews } from "#/helpers/network/Engagement";
import type { HttpsUrl } from "#/types";

interface ViewCounterProperties {
  url: HttpsUrl; // the URL for which to fetch the views
  color?: ColorValue;
  style?: TextStyle;
}

/**
 * Renders View Counter for a given URL
 */
const ViewCounter = (properties: ViewCounterProperties) => {
  const [isLoading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const color = properties?.color ?? "#fff";

  useEffect(() => {
    if (!Config.enableEngagement) return;
    let isCancelled = false;
    setLoading(true);
    getViews(properties.url).then((views) => {
      if (isCancelled) return;
      setViews(views);
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [properties.url]);

  if (!Config.enableEngagement) return null;

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
