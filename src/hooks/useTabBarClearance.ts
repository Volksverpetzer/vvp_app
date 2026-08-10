import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "#/constants/Spacing";

/**
 * Bottom clearance for scrollable content on a screen rendered inside the
 * native bottom tab bar (`NativeTabs`). `insets.bottom` already includes the
 * tab bar's real height — it's a genuine native TabView, not a JS-rendered
 * overlay, so iOS/Android propagate it as part of the safe area — this just
 * adds a bit of breathing room beyond the bar's edge.
 *
 * Only use this on screens actually rendered inside `(tabs)`; elsewhere
 * `insets.bottom` is just the device's home-indicator inset.
 */
export const useTabBarClearance = () => {
  const { bottom } = useSafeAreaInsets();
  return bottom + spacing.xl;
};
