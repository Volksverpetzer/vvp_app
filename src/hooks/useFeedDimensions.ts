import { useWindowDimensions } from "react-native";

import { styles } from "#/constants/Styles";

const FEED_MAX_WIDTH = styles.content.maxWidth;
const FEED_HORIZONTAL_PADDING = styles.content.paddingHorizontal * 2;

export const useFeedDimensions = () => {
  const { width } = useWindowDimensions();

  return {
    width: Math.max(
      0,
      Math.min(width, FEED_MAX_WIDTH) - FEED_HORIZONTAL_PADDING,
    ),
  };
};
