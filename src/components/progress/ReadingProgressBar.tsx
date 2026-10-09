import type {
  Animated,
  DimensionValue,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Animated as RNAnimated } from "react-native";

import { layers } from "#/constants/Layers";

interface ReadingProgressBarProperties {
  /**
   * How far the bar is filled. Pass an `Animated.Value` (article view: driven
   * continuously off the scroll offset) or a plain `DimensionValue` such as
   * "42%" (feed card: set once from the stored reading position).
   */
  progress: Animated.Value | DimensionValue;
  /** Bar thickness in px. The article view and the feed card use different values. */
  height: number;
  /** Fill color, e.g. the theme's primary or accent token. */
  color: string;
  /** Extra styling for positioning — e.g. `position: "absolute"` in the article view. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The reading-progress indicator shown both below an article's header image
 * (feed card) and pinned to the top of the screen while reading (article
 * view). Only the visual bar is shared — each caller keeps its own logic for
 * tracking and persisting progress, since the article view animates
 * continuously off live scroll events while the feed card just reflects a
 * one-shot read of the stored position.
 */
const ReadingProgressBar = ({
  progress,
  height,
  color,
  style,
  testID,
}: ReadingProgressBarProperties) => (
  <RNAnimated.View
    testID={testID}
    style={[
      {
        zIndex: layers.raised,
        height,
        width: progress,
        backgroundColor: color,
      },
      style,
    ]}
  />
);

export default ReadingProgressBar;
