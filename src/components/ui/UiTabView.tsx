import type { ReactNode } from "react";
import { Animated, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { radii } from "#/constants/BorderRadius";

interface UiTabViewProps {
  children: ReactNode;
  width: number;
  animatedHeight?: Animated.AnimatedInterpolation<number>;
  style?: StyleProp<ViewStyle>;
}

const pillStyle: ViewStyle = {
  borderRadius: radii.xl,
  overflow: "hidden",
  flexDirection: "row",
};

const UiTabView = ({
  children,
  width,
  animatedHeight,
  style,
}: UiTabViewProps) => {
  if (animatedHeight != null) {
    return (
      <Animated.View
        style={[pillStyle, { width, height: animatedHeight }, style]}
      >
        {children}
      </Animated.View>
    );
  }
  return <View style={[pillStyle, { width }, style]}>{children}</View>;
};

export default UiTabView;
