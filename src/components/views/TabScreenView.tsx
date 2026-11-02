import type { PropsWithChildren } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Root container for screens rendered inside `NativeTabs`.
 *
 * Since iPadOS 18 the native tab bar floats at the top of the screen on
 * regular-width iPads and overlaps the tab's content. NativeTabs wraps each
 * tab in its own SafeAreaProvider, so `insets.top` here is exactly the part
 * covered by that bar (the status bar is already handled by AppFrame).
 *
 * Limited to iPad: on iPhone the tab bar always sits at the bottom, and the
 * nested provider briefly reports the window inset on its first frame, which
 * would make the layout jump.
 */
const TabScreenView = ({ children }: PropsWithChildren) => {
  const { top } = useSafeAreaInsets();
  const paddingTop = Platform.OS === "ios" && Platform.isPad ? top : 0;

  // Nested so absolutely positioned children (AnimatedHeader) are laid out
  // below the padding instead of relative to the padded container.
  return (
    <View style={{ flex: 1, paddingTop }}>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
};

export default TabScreenView;
