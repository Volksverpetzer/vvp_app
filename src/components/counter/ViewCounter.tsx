import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import Config from "../../constants/Config";
import { getViews } from "../../helpers/Networking/Analytics";
import Text from "../design/Text";

interface ViewCounterProperties {
  url: string; // the URL for which to fetch the views
  color?: string;
  style?: any;
}

/**
 * Renders View Counter for a given URL
 */
const ViewCounter = (properties: ViewCounterProperties) => {
  const [isLoading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  useEffect(() => {
    if (!Config.analytics) return;
    getViews(properties.url).then((views) => {
      //console.log(views)
      setViews(views);
      setLoading(false);
    });
  });
  if (!Config.analytics) return;
  return (
    <>
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text
          style={{
            color: properties?.color ?? "#fff",
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
