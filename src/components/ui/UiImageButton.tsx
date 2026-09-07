import { Image } from "expo-image";
import type { ImageSource } from "expo-image";

import UiPressable from "#/components/ui/UiPressable";
import { radii } from "#/constants/BorderRadius";

interface UiImageButtonProperties {
  source: ImageSource;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Pressable payment/partner logo (PayPal, Steady, shop badges). For a
 * labeled call-to-action button, use {@link UiButton} instead.
 */
const UiImageButton = ({
  source,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: UiImageButtonProperties) => (
  <UiPressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    onPress={onPress}
  >
    <Image
      source={source}
      style={{ width: 220, height: 40, borderRadius: radii.xs }}
    />
  </UiPressable>
);

export default UiImageButton;
