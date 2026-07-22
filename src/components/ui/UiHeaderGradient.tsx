import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import Colors from "#/constants/Colors";
import { hexToRgb } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/** Fraction of the header that stays solid before the fade begins. */
const GRADIENT_LOCATIONS: [number, number] = [0.7, 1];

/**
 * Shared header background: a vertical gradient from the app background color
 * (solid at the top) fading to near-transparent at the bottom, so the header
 * blends into the surface below instead of reading as a hard-edged block.
 *
 * This is the "general" header look used across the app (personal tab, etc.);
 * both the animated collapsing headers and the static search header render
 * their content inside it.
 */
const UiHeaderGradient = ({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].background;
  const [r, g, b] = useMemo(() => hexToRgb(backgroundColor), [backgroundColor]);

  return (
    <LinearGradient
      colors={[`rgba(${r},${g},${b},1)`, `rgba(${r},${g},${b},0.1)`]}
      locations={GRADIENT_LOCATIONS}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export default UiHeaderGradient;
