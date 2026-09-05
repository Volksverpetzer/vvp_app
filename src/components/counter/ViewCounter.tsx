import { useEffect, useState } from "react";
import type { ColorValue, StyleProp, TextStyle } from "react-native";
import { ActivityIndicator, View } from "react-native";

import { ArticleViewIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import Config from "#/constants/Config";
import { spacing } from "#/constants/Spacing";
import { getViews } from "#/helpers/network/Engagement";
import type { HttpsUrl } from "#/types";

interface ViewCounterProperties {
  url: HttpsUrl; // the URL for which to fetch the views
  color?: ColorValue;
  style?: StyleProp<TextStyle>;
  size?: number;
  onLoad?: (count: number) => void;
}

/**
 * Renders View Counter for a given URL
 */
const ViewCounter = (properties: ViewCounterProperties) => {
  const {
    color: colorProp = "#fff",
    size = 24,
    style,
    url,
    onLoad,
  } = properties;

  const [isLoading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const color = colorProp;

  useEffect(() => {
    if (!Config.enableEngagement) return;
    let isCancelled = false;
    setLoading(true);
    getViews(url)
      .then((views) => {
        if (isCancelled) return;
        setViews(views);
        setLoading(false);
        onLoad?.(views);
      })
      .catch(() => {
        // Treat a failed fetch as 0 so the loader resolves and onLoad always
        // fires — otherwise the badge would spin forever.
        if (isCancelled) return;
        setViews(0);
        setLoading(false);
        onLoad?.(0);
      });

    return () => {
      isCancelled = true;
    };
  }, [url, onLoad]);

  if (!Config.enableEngagement) return null;

  // TODO replace ActivityIndicator with UiSpinner and adjust styling
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
    >
      <ArticleViewIcon size={size} color={color} />
      {isLoading ? (
        <ActivityIndicator color={color} />
      ) : (
        <UiText size="sm" style={[{ color: color }, style]}>
          {views.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".")}
        </UiText>
      )}
    </View>
  );
};

export default ViewCounter;
