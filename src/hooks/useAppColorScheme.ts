import { useContext } from "react";
import type { ColorSchemeName } from "react-native";
import { useColorScheme } from "react-native";

import Colors from "#/constants/Colors";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { isDarkMode } from "#/helpers/utils/color";
import type { colorSchemeType } from "#/types/colors";

export type AppColorScheme = keyof colorSchemeType;

export const ColorScheme = {
  light: "light",
  dark: "dark",
} as const satisfies Record<AppColorScheme, AppColorScheme>;

/**
 * A hook that returns the app's color scheme: the one the user picked in the
 * settings ("Darstellung"), or the device's color scheme if they left it on
 * "System".
 * @returns The color scheme the app should render in.
 */
export const useAppColorScheme = (): AppColorScheme => {
  const { themePreference } = useContext(SettingsContext);
  const scheme: ColorSchemeName = useColorScheme();
  if (themePreference === ColorScheme.light) return ColorScheme.light;
  if (themePreference === ColorScheme.dark) return ColorScheme.dark;
  return scheme === ColorScheme.dark ? ColorScheme.dark : ColorScheme.light;
};

/**
 * A hook that returns the corporate color for the current color scheme.
 * @returns The corporate color for the current color scheme.
 */
export const useCorporateColor = () => {
  const colorScheme = useAppColorScheme();
  return Colors[colorScheme].primary;
};

export const useReverseColorScheme = () => {
  const colorScheme = useAppColorScheme();
  return isDarkMode(colorScheme) ? ColorScheme.light : ColorScheme.dark;
};
