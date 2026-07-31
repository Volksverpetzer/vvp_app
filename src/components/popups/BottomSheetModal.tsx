import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface BottomSheetModalProperties {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Extra styles for the sheet container, e.g. a maxHeight. */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * A bottom-anchored sheet modal: a rounded surface that slides up from the
 * bottom with a drag handle, a title + close-button header, and swipe/backdrop
 * dismissal. Content below the header is provided via children. The bottom
 * padding includes the safe-area inset so content clears the Android nav bar.
 */
const BottomSheetModal = ({
  isVisible,
  onClose,
  title,
  children,
  containerStyle,
}: BottomSheetModalProperties) => {
  const colorScheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const corporate = Colors[colorScheme].primary;
  const surface = Colors[colorScheme].surface;
  const textMuted = Colors[colorScheme].textMuted;

  return (
    <Modal
      isVisible={isVisible}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <View
        style={[
          styles.container,
          // containerStyle sits between the base container style and the
          // safe-area object below: it can override styles.container (e.g.
          // maxHeight), but the trailing object still wins over containerStyle,
          // keeping the safe-area padding/background authoritative.
          containerStyle,
          { backgroundColor: surface, paddingBottom: 28 + insets.bottom },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: textMuted }]} />
        <UiSpace size={16} />
        <View style={styles.header}>
          <UiText bold size="xl">
            {title}
          </UiText>
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Schließen"
            onPress={onClose}
            hitSlop={8}
          >
            <CloseIcon size={28} color={corporate} />
          </UiPressable>
        </View>
        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  header: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default BottomSheetModal;
