import { FC, ReactElement } from "react";
import { Pressable, Text as RNText, View as RNView } from "react-native";
import { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import useAppColorScheme from "#/hooks/useAppColorScheme";

interface RightActionProps {
  progress?: SharedValue<number>;
  drag: SharedValue<number>;
  swipeable: SwipeableMethods;
  onAction: (href?: string) => Promise<void> | void;
  href?: string;
  label?: string;
  icon?: ReactElement;
  backgroundColor?: string;
  iconSize?: number;
}

const RightAction: FC<RightActionProps> = ({
  drag,
  swipeable,
  onAction,
  href,
  label = "Löschen",
  icon,
  backgroundColor,
}) => {
  const colorScheme = useAppColorScheme();
  const bg = backgroundColor ?? Colors[colorScheme].highlight;

  const actionStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      drag.value,
      [-120, 0],
      [0, 120],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      drag.value,
      [-120, -60, 0],
      [1, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }], opacity };
  });

  return (
    <RNView style={{ justifyContent: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={`${label} diese Quelle`}
        onPress={async () => {
          await onAction(href);
          swipeable.close();
        }}
      >
        <Animated.View
          style={[
            {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: bg,
              paddingHorizontal: 20,
              height: "100%",
            },
            actionStyle,
          ]}
        >
          {icon}
          <RNText
            style={{ ...styles.whiteText, fontWeight: "bold", marginTop: 6 }}
          >
            {label}
          </RNText>
        </Animated.View>
      </Pressable>
    </RNView>
  );
};

export default RightAction;
