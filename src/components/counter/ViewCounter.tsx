import { useEffect, useState } from "react";
import type { ColorValue, TextStyle } from "react-native";
import { ActivityIndicator, View } from "react-native";

import { ArticleViewIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { getViews } from "#/helpers/network/Engagement";
import type { HttpsUrl } from "#/types";

interface ViewCounterProperties {
  url: HttpsUrl; // the URL for which to fetch the views
  color?: ColorValue;
  style?: TextStyle;
  size?: number;
}

/**
 * Renders View Counter for a given URL
 */
const ViewCounter = (properties: ViewCounterProperties) => {
  const { color: colorProp = "#fff", size = 24, style, url } = properties;

  const [isLoading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const color = colorProp;

  useEffect(() => {
    if (!Config.enableEngagement) return;
    let isCancelled = false;
    setLoading(true);
    getViews(url).then((views) => {
      if (isCancelled) return;
      setViews(views);
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  if (!Config.enableEngagement) return null;

  // TODO replace ActivityIndicator with UiSpinner and adjust styling
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <ArticleViewIcon size={size} color={color} />
      {isLoading ? (
        <ActivityIndicator color={color} />
      ) : (
        <UiText
          style={{
            color: color,
            fontSize: 14,
            ...style,
          }}
        >
          {views.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".")}
        </UiText>
      )}
    </View>
  );
};

export default ViewCounter;
