import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { type PropsWithChildren, useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "#/constants/Colors";
import { isDarkMode } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const SECONDARY_BG_SCREENS = new Set(["action", "support"]);

/**
 * Manages the background color for the app shell — including the notch/status bar
 * area — based on the current screen and color scheme. Lives inside all providers
 * so a forced light/dark theme is respected.
 */
const AppFrame = ({ children }: PropsWithChildren) => {
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const isSecondaryBg = segments.some((s) => SECONDARY_BG_SCREENS.has(s));
  const backgroundColor = isSecondaryBg
    ? Colors[colorScheme].surface
    : Colors[colorScheme].background;

  // React Navigation paints its screen containers (stack cards, the view
  // around each native tab) with the theme background. Without a theme that
  // is the light default (#F2F2F2), which showed as a light strip behind the
  // iPad/macOS top tab bar in dark mode, so follow the in-app theme instead.
  const navigationTheme = useMemo(() => {
    const base = isDarkMode(colorScheme) ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: Colors[colorScheme].background },
    };
  }, [colorScheme]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    SystemUI.setBackgroundColorAsync(backgroundColor).catch((error) => {
      console.warn("Failed to set system background color", error);
    });
  }, [backgroundColor]);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor,
      }}
    >
      <StatusBar style={isDarkMode(colorScheme) ? "light" : "dark"} />
      <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
    </View>
  );
};

export default AppFrame;
