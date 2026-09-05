import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { ChevronIcon } from "#/components/Icons";
import UiFab from "#/components/ui/UiFab";
import Colors from "#/constants/Colors";
import { iconSizes } from "#/constants/IconSizes";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface BackToTopButtonProperties {
  visible: boolean;
  onPress: () => void;
}

/**
 * Floating circular button that scrolls the current screen back to the top.
 * Intended for screens without the bottom tab bar (article, search,
 * licenses). Render it as the last sibling of the scroll container inside a
 * flex: 1 wrapper so it floats above the content but stays clear of the
 * NavBar below. Drive `visible` with the useBackToTop hook.
 */
const BackToTopButton = ({ visible, onPress }: BackToTopButtonProperties) => {
  const colorScheme = useAppColorScheme();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={styles.container}
    >
      <UiFab accessibilityLabel="Zurück nach oben" onPress={onPress}>
        <ChevronIcon
          direction="up"
          size={iconSizes.md}
          color={Colors[colorScheme].background}
        />
      </UiFab>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    bottom: 20,
    position: "absolute",
    right: 20,
  },
});

export default BackToTopButton;
