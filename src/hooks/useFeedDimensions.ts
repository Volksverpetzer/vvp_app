import { useWindowDimensions } from "react-native";

import {
  CONTENT_HORIZONTAL_PADDING,
  CONTENT_MAX_WIDTH,
} from "#/constants/GlobalStyles";

const FEED_MAX_WIDTH = CONTENT_MAX_WIDTH;
const FEED_HORIZONTAL_PADDING = CONTENT_HORIZONTAL_PADDING * 2;

export const useFeedDimensions = () => {
  const { width } = useWindowDimensions();

  return {
    width: Math.max(
      0,
      Math.min(width, FEED_MAX_WIDTH) - FEED_HORIZONTAL_PADDING,
    ),
  };
};
