import { Image } from "expo-image";
import type { ImageSource } from "expo-image";
import { Pressable } from "react-native";

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
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    onPress={onPress}
  >
    <Image
      source={source}
      style={{ width: 220, height: 40, borderRadius: 4 }}
    />
  </Pressable>
);

export default UiButton;
