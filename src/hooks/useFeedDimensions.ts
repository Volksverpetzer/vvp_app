import { useWindowDimensions } from "react-native";

import { globalStyles } from "#/constants/GlobalStyles";

const FEED_MAX_WIDTH = globalStyles.content.maxWidth;
const FEED_HORIZONTAL_PADDING = globalStyles.content.paddingHorizontal * 2;

export const useFeedDimensions = () => {
  const { width } = useWindowDimensions();

  return {
    width: Math.max(
      0,
      Math.min(width, FEED_MAX_WIDTH) - FEED_HORIZONTAL_PADDING,
    ),
  };
};
