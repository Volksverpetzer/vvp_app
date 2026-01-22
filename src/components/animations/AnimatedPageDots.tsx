import { Animated, View } from "react-native";

import { useCorporateColor } from "#/hooks/useColorScheme";

interface AnimatedPageDotsProperties {
  scrollX: Animated.Value;
  width: number;
  length: number;
  color?: string;
}

const AnimatedPageDots = (properties: AnimatedPageDotsProperties) => {
  const { scrollX, width, length, color } = properties;
  const corporate = useCorporateColor();
  const backgroundColor = color || corporate;
  return (
    <View style={{ flexDirection: "row" }}>
      {[...Array.from({ length }).keys()].map((index) => {
        const opacity = Animated.divide(scrollX, width).interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={index}
            style={{
              opacity,
              height: 5,
              width: 5,
              backgroundColor,
              marginHorizontal: 3,
              marginVertical: 10,
              borderRadius: 5,
            }}
          />
        );
      })}
    </View>
  );
};

export default AnimatedPageDots;
