import { StyleSheet, View } from "react-native";
import Modal from "react-native-modal";

import { CloseIcon } from "#/components/Icons";
import Heading from "#/components/typography/Heading";
import UiPressable from "#/components/ui/UiPressable";
import UiSpace from "#/components/ui/UiSpace";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { outBoundLinkPress } from "#/helpers/Linking";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, ImageCredit } from "#/types";

interface ImageCreditModalProperties {
  isVisible: boolean;
  onClose: () => void;
  credit: ImageCredit;
}

const ImageCreditModal = ({
  isVisible,
  onClose,
  credit,
}: ImageCreditModalProperties) => {
  const colorScheme = useAppColorScheme();
  const corporate = Colors[colorScheme].primary;
  const surface = Colors[colorScheme].surface;
  const textMuted = Colors[colorScheme].textMuted;

  // isc_image_source_url is free-form WordPress admin input, not guaranteed
  // https — trim and only offer it as a tappable link when it actually is one.
  const trimmedSourceUrl = credit.sourceUrl?.trim();
  const sourceUrl = trimmedSourceUrl?.startsWith("https://")
    ? (trimmedSourceUrl as HttpsUrl)
    : undefined;

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
          <Heading style={styles.title}>Bildquelle</Heading>
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Schließen"
            onPress={onClose}
            hitSlop={8}
          >
            <CloseIcon size={28} color={corporate} />
          </UiPressable>
        </View>
        <UiSpace size={12} />
        <UiText style={styles.source}>{credit.source}</UiText>
        {credit.licence ? (
          <>
            <UiSpace size={8} />
            <UiText style={[styles.licence, { color: textMuted }]}>
              {credit.licence}
            </UiText>
          </>
        ) : null}
        {sourceUrl ? (
          <>
            <UiSpace size={12} />
            <UiPressable
              accessibilityRole="link"
              onPress={() => outBoundLinkPress(sourceUrl)}
            >
              <UiText style={[styles.link, { color: corporate }]}>
                {sourceUrl}
              </UiText>
            </UiPressable>
          </>
        ) : null}
        <UiSpace size={20} />
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
  source: {
    fontSize: 16,
  },
  licence: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default ImageCreditModal;
