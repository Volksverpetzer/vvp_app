import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import Colors from "#/constants/Colors";
import { hexToRgb } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/** Height of the strip at the bottom of the header that fades out. */
export const HEADER_FADE_HEIGHT = 45;

const FADE_LOCATIONS: [number, number, number, number] = [0, 0.35, 0.7, 1];
const FADE_ALPHAS = [1, 0.75, 0.35, 0.1];

const fadeStyle: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: HEADER_FADE_HEIGHT,
};

/**
 * Shared header background: solid app background color behind the content,
 * fading to near-transparent over a fixed strip at the bottom
 * (`HEADER_FADE_HEIGHT`) so the header blends into the surface below instead
 * of reading as a hard-edged block.
 *
 * The fade has a fixed height rather than a percentage of the header, so
 * content that keeps `HEADER_FADE_HEIGHT` of bottom padding stays fully
 * covered however far the header collapses.
 *
 * Used by every header: the animated collapsing headers and the static search
 * header render their content inside it.
 */
const UiHeaderGradient = ({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const [r, g, b] = useMemo(() => hexToRgb(backgroundColor), [backgroundColor]);
  const fadeColors = useMemo(
    () =>
      FADE_ALPHAS.map((a) => `rgba(${r},${g},${b},${a})`) as [
        string,
        string,
        string,
        string,
      ],
    [r, g, b],
  );

  return (
    <View style={style}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { bottom: HEADER_FADE_HEIGHT, backgroundColor },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={fadeColors}
        locations={FADE_LOCATIONS}
        style={fadeStyle}
      />
      {children}
    </View>
  );
};

export default UiHeaderGradient;
