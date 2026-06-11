import { ScrollView, StyleSheet, View } from "react-native";
import Modal from "react-native-modal";

import { CloseIcon } from "#/components/Icons";
import Heading from "#/components/typography/Heading";
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
  const surface = Colors[colorScheme].surface;
  const textMuted = Colors[colorScheme].textMuted;
  const iconOnPrimary = Colors[colorScheme].iconOnPrimary;

  return (
    <Modal
      isVisible={isVisible}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: surface }]}>
        <View style={[styles.handle, { backgroundColor: textMuted }]} />
        <UiSpace size={16} />
        <View style={styles.header}>
          <Heading style={styles.title}>Was ist neu?</Heading>
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Schließen"
            onPress={onClose}
            hitSlop={8}
          >
            <CloseIcon size={28} color={corporate} />
          </UiPressable>
        </View>
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
          <UiText style={[styles.buttonText, { color: iconOnPrimary }]}>
            Alles klar
          </UiText>
        </UiPressable>
        <UiSpace size={8} />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    borderRadius: 2,
    height: 4,
    marginTop: 12,
    width: 40,
  },
  header: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
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
