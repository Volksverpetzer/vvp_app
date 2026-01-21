import { useRouter } from "expo-router";
import { FC, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Fehler } from "../../../../components/Icons";
import { styles } from "../../../../constants/Styles";

interface BlockRenderProperties {
  renderProps: {
    TDefaultRenderer: FC<Record<string, unknown>>;
    renderIndex: number;
  };
  url: string;
}

/**
 * TODO split up file
 */
const BlockRenderer = (properties: BlockRenderProperties) => {
  //const { advancedSettings } = useContext(SettingsContext);
  const router = useRouter();
  const [blockHeight, setHeight] = useState(0);
  if (!("TDefaultRenderer" in properties.renderProps)) {
    return undefined;
  }

  const DefaultRender = () => {
    return (
      <View
        style={blockStyles.container}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeight(height);
        }}
      >
        <properties.renderProps.TDefaultRenderer {...properties.renderProps} />
      </View>
    );
  };

  const errorReport = () => {
    // Navigate to report screen with prefilled URL and index
    router.push({
      pathname: "/(tabs)/report",
      params: {
        url: properties.url,
        index: String(properties.renderProps.renderIndex),
      },
    });
  };

  // Animated right-action buttons that fade in/out based on drag
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
            style={[
              blockStyles.sheet,
              actionStyle,
              { height: blockHeight / 3 },
            ]}
          >
            <Fehler />
            <Text style={blockStyles.sheetText}>Fehler melden</Text>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  /*
  if (advancedSettings.advancedReporting?.value === true)
    return (
      <Swipeable
        containerStyle={blockStyles.swipeContainer}
        childrenContainerStyle={blockStyles.swipeChildren}
        renderRightActions={(p, d, s) => (
          <RightActions progress={p} drag={d} swipeable={s} />
        )}
      >
        <DefaultRender />
      </Swipeable>
    );
  */

  return <DefaultRender />;
};

export default BlockRenderer;

const blockStyles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    maxWidth: "100%",
    width: "100%",
  },
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
    ...styles.whiteText,
    fontSize: 14,
    fontWeight: "bold",
  },
});
