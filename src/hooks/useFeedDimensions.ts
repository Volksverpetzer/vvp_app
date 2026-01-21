import { useWindowDimensions } from "react-native";

import { styles } from "../constants/Styles";

export const useFeedDimensions = () => {
  const { width } = useWindowDimensions();
  const maxWidth = styles.feed.maxWidth;
  const percentOfWidth = Number.parseFloat(styles.feed.width) / 100;

  return {
    width: width > maxWidth ? maxWidth : width * percentOfWidth,
  };
};
