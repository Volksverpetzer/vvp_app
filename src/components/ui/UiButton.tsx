import { Image } from "expo-image";
import type { ImageSource } from "expo-image";

import UiPressable from "#/components/ui/UiPressable";

interface UiButtonProps {
  source: ImageSource;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const UiButton = ({
  source,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: UiButtonProps) => (
  <UiPressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    onPress={onPress}
  >
    <Image
      source={source}
      style={{ width: 220, height: 40, borderRadius: 4 }}
    />
  </UiPressable>
);

export default UiButton;
