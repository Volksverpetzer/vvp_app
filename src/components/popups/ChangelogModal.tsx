import { ScrollView, StyleSheet } from "react-native";

import BottomSheetModal from "#/components/popups/BottomSheetModal";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Changelog from "#/constants/Changelog";
import Colors from "#/constants/Colors";
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
      <UiText style={[styles.version, { color: textMuted }]}>
        Version {Changelog.version}
      </UiText>
      <UiSpace size={12} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <UiText style={styles.notes}>{Changelog.notes}</UiText>
      </ScrollView>
      <UiSpace size={20} />
      <UiPressable
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.button, { backgroundColor: corporate }]}
      >
        <UiText style={[styles.buttonText, { color: onPrimary }]}>
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
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    flexShrink: 1,
  },
  notes: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
  },
  buttonText: {
    fontFamily: "SourceSansProBold",
    fontSize: 16,
  },
});

export default ChangelogModal;
