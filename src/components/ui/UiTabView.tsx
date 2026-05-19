import type { ReactNode } from "react";
import { Animated, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

interface TabViewProps {
  children: ReactNode;
  width: number;
  animatedHeight?: Animated.AnimatedInterpolation<number>;
  style?: StyleProp<ViewStyle>;
}

const pillStyle = {
  borderRadius: 20,
  overflow: "hidden" as const,
  flexDirection: "row" as const,
};

const TabView = ({ children, width, animatedHeight, style }: TabViewProps) => {
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

export default TabView;
