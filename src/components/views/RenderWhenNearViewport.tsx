import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View, useWindowDimensions } from "react-native";

import { useNearViewport } from "#/hooks/useNearViewport";

interface RenderWhenNearViewportProperties {
  /** Should reserve roughly the content's height, so layout doesn't jump. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}

/**
 * Mounts its children only once they scroll within about a screen of the
 * visible window (see useNearViewport); until then just the styled,
 * empty placeholder view.
 */
const RenderWhenNearViewport = ({
  style,
  testID,
  children,
}: RenderWhenNearViewportProperties) => {
  const { height } = useWindowDimensions();
  const { near, ref, onLayout } = useNearViewport(height);
  return (
    <View ref={ref} onLayout={onLayout} style={style} testID={testID}>
      {near ? children : null}
    </View>
  );
};

export default RenderWhenNearViewport;
