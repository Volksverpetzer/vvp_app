import { useWindowDimensions } from "react-native";

import { styles } from "#/constants/Styles";

const FEED_MAX_WIDTH = styles.feed.maxWidth;
const FEED_WIDTH_PERCENT = Number.parseFloat(styles.feed.width) / 100;

/**
 * TODO do we really need this?
 */
export const useFeedDimensions = () => {
  const { width } = useWindowDimensions();

  return {
    width: width > FEED_MAX_WIDTH ? FEED_MAX_WIDTH : width * FEED_WIDTH_PERCENT,
  };
};
