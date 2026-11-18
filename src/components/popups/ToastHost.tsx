import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { spacing } from "#/constants/Spacing";
import { toastConfig } from "#/helpers/toastConfig";

/**
 * Height of the bottom tab bar above the safe-area inset: the native tab
 * bar on iOS (49pt) and Android (Material navigation bar, 80dp), and the
 * web tab bar (48px).
 */
const TAB_BAR_HEIGHT = Platform.select({ ios: 49, android: 80, default: 48 });

/**
 * Narrowest window that iPadOS lays out at regular width. Below it (Slide
 * Over, narrow Split View: at most ~590pt) the window is compact. There is no
 * size-class API in React Native, so the width stands in for it.
 */
const IPAD_REGULAR_MIN_WIDTH = 640;

/**
 * Whether the tab bar sits at the bottom of the window. Since iPadOS 18 the
 * native tab bar floats at the top on regular-width iPads (see
 * TabScreenView); everywhere else it is at the bottom.
 */
export const isTabBarAtBottom = (windowWidth: number) =>
  !(
    Platform.OS === "ios" &&
    Platform.isPad &&
    windowWidth >= IPAD_REGULAR_MIN_WIDTH
  );

/** Distance of a toast's bottom edge from the screen's bottom edge. */
export const toastBottomOffset = (bottomInset: number, tabBarAtBottom = true) =>
  bottomInset + (tabBarAtBottom ? TAB_BAR_HEIGHT : 0) + spacing.sm;

/**
 * Renders every toast in the app. All toasts appear at the bottom, just
 * above the tab bar when it is at the bottom, so messages always show up in
 * the same place and an achievement doesn't look like a system notification
 * banner at the top. Screens without a tab bar get the same offset, which
 * only lifts the toast a little.
 */
const ToastHost = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <Toast
      config={toastConfig}
      position="bottom"
      bottomOffset={toastBottomOffset(insets.bottom, isTabBarAtBottom(width))}
    />
  );
};

export default ToastHost;
