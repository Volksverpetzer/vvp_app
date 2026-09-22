import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import Colors from "#/constants/Colors";
import { hexToRgb } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

/**
 * Fade starts early and eases out over several stops, so the bottom edge
 * blends in gradually instead of showing a visible band.
 */
const GRADIENT_LOCATIONS: [number, number, number, number] = [
  0.4, 0.62, 0.82, 1,
];
const GRADIENT_ALPHAS = [1, 0.75, 0.35, 0.1];

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
      colors={
        GRADIENT_ALPHAS.map((a) => `rgba(${r},${g},${b},${a})`) as [
          string,
          string,
          string,
          string,
        ]
      }
      locations={GRADIENT_LOCATIONS}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export default UiHeaderGradient;
