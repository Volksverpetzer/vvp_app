import { useRouter } from "expo-router";
import { FC, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Fehler } from "#/components/Icons";
import { styles as globalStyles } from "#/constants/Styles";

interface ReportingWrapperProperties {
  url: string;
  renderIndex: number;
  blockHeight: number;
  children: ReactNode;
}

/**
 * Handles Swipeable / RightActions / Navigation für error reporting.
 */
const ReportingWrapper = ({
  url,
  renderIndex,
  blockHeight,
  children,
}: ReportingWrapperProperties) => {
  const router = useRouter();

  const errorReport = () => {
    router.push({
      pathname: "/(tabs)/report",
      params: {
        url,
        index: String(renderIndex),
      },
    });
  };

  const RightActions: FC<{
    progress: SharedValue<number>;
    drag: SharedValue<number>;
    swipeable: SwipeableMethods;
  }> = ({ drag }) => {
    const actionStyle = useAnimatedStyle(() => {
      "worklet";
      const translateX = interpolate(
        drag.value,
        [-100, 0],
        [0, 100],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        drag.value,
        [-100, -50, 0],
        [1, 1, 0],
        Extrapolation.CLAMP,
      );
      return { transform: [{ translateX }], opacity };
    });

    return (
      <View style={{ justifyContent: "center" }}>
        <Pressable accessibilityRole="button" onPress={errorReport}>
          <Animated.View
            style={[styles.sheet, actionStyle, { height: blockHeight / 3 }]}
          >
            <Fehler />
            <Text style={styles.sheetText}>Fehler melden</Text>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={styles.swipeChildren}
      renderRightActions={(p, d, s) => (
        <RightActions progress={p} drag={d} swipeable={s} />
      )}
    >
      {children}
    </Swipeable>
  );
};

export default ReportingWrapper;

const styles = StyleSheet.create({
  swipeContainer: {
    alignSelf: "stretch",
    maxWidth: "100%",
    width: "100%",
  },
  swipeChildren: {
    flexGrow: 1,
    maxWidth: "100%",
    width: "100%",
  },
  sheet: {
    alignItems: "center",
    borderBottomLeftRadius: 50,
    borderTopLeftRadius: 50,
    justifyContent: "center",
    maxHeight: 70,
    paddingLeft: 20,
  },
  sheetText: {
    ...globalStyles.whiteText,
    fontSize: 14,
    fontWeight: "bold",
  },
});
