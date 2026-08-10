import { ScrollView, StyleSheet } from "react-native";

import BottomSheetModal from "#/components/popups/BottomSheetModal";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Changelog from "#/constants/Changelog";
import Colors from "#/constants/Colors";
import { LINE_HEIGHTS } from "#/constants/FontSizes";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

interface ChangelogModalProperties {
  isVisible: boolean;
  onClose: () => void;
}

const ChangelogModal = ({ isVisible, onClose }: ChangelogModalProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const textMuted = Colors[colorScheme].textMuted;
  const onPrimary = Colors[colorScheme].onPrimary;

  return (
    <BottomSheetModal
      isVisible={isVisible}
      onClose={onClose}
      title="Was ist neu?"
      containerStyle={styles.container}
    >
      <UiText size="sm" style={[styles.version, { color: textMuted }]}>
        Version {Changelog.version}
      </UiText>
      <UiSpace size={spacing.md} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <UiText size="base" style={styles.notes}>
          {Changelog.notes}
        </UiText>
      </ScrollView>
      <UiSpace size={spacing.xl} />
      <UiPressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.button, { backgroundColor: corporate }]}
      >
        <UiText size="base" bold style={{ color: onPrimary }}>
          Alles klar
        </UiText>
      </UiPressable>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: "80%",
  },
  version: {
    marginTop: spacing.xs,
  },
  scroll: {
    flexShrink: 1,
  },
  notes: {
    lineHeight: LINE_HEIGHTS.base,
  },
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
});

export default ChangelogModal;
