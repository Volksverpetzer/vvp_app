import { StyleSheet } from "react-native";

import BottomSheetModal from "#/components/popups/BottomSheetModal";
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
  const textMuted = Colors[colorScheme].textMuted;

  // isc_image_source_url is free-form WordPress admin input, not guaranteed
  // https — trim and only offer it as a tappable link when it actually is one.
  const trimmedSourceUrl = credit.sourceUrl?.trim();
  const sourceUrl = trimmedSourceUrl?.startsWith("https://")
    ? (trimmedSourceUrl as HttpsUrl)
    : undefined;

  return (
    <BottomSheetModal
      isVisible={isVisible}
      onClose={onClose}
      title="Bildquelle"
    >
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
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
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
