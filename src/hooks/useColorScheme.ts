import { useContext } from "react";
import {
  ColorSchemeName,
  useColorScheme as _useColorScheme,
} from "react-native";

import Colors from "#/constants/Colors";
import SettingsContext from "#/helpers/SettingsContext";

/**
 * A hook that returns the color scheme of the device, or "dark" if the user has set the advanced setting "Always Dark Mode".
 * @returns The color scheme of the device, or "dark" if the user has set the advanced setting "Always Dark Mode".
 */
export default function useColorScheme(): NonNullable<ColorSchemeName> {
  const { advancedSettings } = useContext(SettingsContext);
  const scheme = _useColorScheme();
  if (advancedSettings?.alwaysDarkMode?.value ?? false)
    return "dark" as NonNullable<ColorSchemeName>;
  return scheme as NonNullable<ColorSchemeName>;
}

/**
 * A hook that returns the corporate color for the current color scheme.
 * @returns The corporate color for the current color scheme.
 */
export const useCorporateColor = () => {
  const colorScheme = useColorScheme();
  return Colors[colorScheme].corporate;
};

export const useReverseColorScheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? "light" : "dark";
};
