import { Image } from "expo-image";
import type { ImageSource } from "expo-image";
import { Pressable } from "react-native";

interface UiButtonProps {
  source: ImageSource;
  onPress: () => void;
}

const UiButton = ({ source, onPress }: UiButtonProps) => (
  <Pressable accessibilityRole="button" onPress={onPress}>
    <Image
      source={source}
      style={{ width: 220, height: 40, borderRadius: 4 }}
    />
  </Pressable>
);

export default UiButton;
