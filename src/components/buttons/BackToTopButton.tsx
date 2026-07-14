import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { ChevronIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
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
      <UiPressable
        accessibilityRole="button"
        accessibilityLabel="Zurück nach oben"
        onPress={onPress}
        style={[
          styles.button,
          { backgroundColor: Colors[colorScheme].primary },
        ]}
      >
        <ChevronIcon
          direction="up"
          size={26}
          color={Colors[colorScheme].background}
        />
      </UiPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 24,
    elevation: 4,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  container: {
    bottom: 20,
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default BackToTopButton;
