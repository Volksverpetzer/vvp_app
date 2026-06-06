import type { ColorValue } from "react-native";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { useCorporateColor } from "#/hooks/useAppColorScheme";

interface DotItemProps {
  index: number;
  progress: SharedValue<number>;
  color: ColorValue;
}

const DotItem = ({ index, progress, color }: DotItemProps) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    ),
  }));
  return (
    <Animated.View
      style={[
        {
          height: 5,
          width: 5,
          backgroundColor: color as string,
          marginHorizontal: 3,
          marginVertical: 10,
          borderRadius: 5,
        },
        style,
      ]}
    />
  );
};

interface AnimatedPageDotsProperties {
  progress: SharedValue<number>;
  length: number;
  color?: ColorValue;
}

const AnimatedPageDots = ({
  progress,
  length,
  color,
}: AnimatedPageDotsProperties) => {
  const corporate = useCorporateColor();
  const backgroundColor = color ?? corporate;
  return (
    <View style={{ flexDirection: "row" }}>
      {[...Array.from({ length }).keys()].map((index) => (
        <DotItem
          key={index}
          index={index}
          progress={progress}
          color={backgroundColor}
        />
      ))}
    </View>
  );
};

export default AnimatedPageDots;
