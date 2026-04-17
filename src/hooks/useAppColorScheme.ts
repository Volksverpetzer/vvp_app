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
 * A hook that returns the color scheme of the device, or "dark" if the user has set the advanced setting "Always Dark Mode".
 * @returns The color scheme of the device, or "dark" if the user has set the advanced setting "Always Dark Mode".
 */
export const useAppColorScheme = (): AppColorScheme => {
  const { advancedSettings } = useContext(SettingsContext);
  const scheme: ColorSchemeName = useColorScheme();
  if (advancedSettings?.alwaysDarkMode?.value ?? false) return ColorScheme.dark;
  return scheme === ColorScheme.dark ? ColorScheme.dark : ColorScheme.light;
};

/**
 * A hook that returns the corporate color for the current color scheme.
 * @returns The corporate color for the current color scheme.
 */
export const useCorporateColor = () => {
  const colorScheme = useAppColorScheme();
  return Colors[colorScheme].corporate;
};

export const useReverseColorScheme = () => {
  const colorScheme = useAppColorScheme();
  return isDarkMode(colorScheme) ? ColorScheme.light : ColorScheme.dark;
};
