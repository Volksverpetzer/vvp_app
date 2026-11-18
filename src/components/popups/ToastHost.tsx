import { Platform } from "react-native";
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

/** Distance of a toast's bottom edge from the screen's bottom edge. */
export const toastBottomOffset = (bottomInset: number) =>
  bottomInset + TAB_BAR_HEIGHT + spacing.sm;

/**
 * Renders every toast in the app. All toasts appear at the bottom, just
 * above the tab bar, so messages always show up in the same place and an
 * achievement doesn't look like a system notification banner at the top.
 * Screens without a tab bar get the same offset, which only lifts the toast
 * a little.
 */
const ToastHost = () => {
  const insets = useSafeAreaInsets();
  return (
    <Toast
      config={toastConfig}
      position="bottom"
      bottomOffset={toastBottomOffset(insets.bottom)}
    />
  );
};

export default ToastHost;
