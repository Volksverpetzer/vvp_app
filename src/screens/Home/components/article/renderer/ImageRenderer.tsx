import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, useWindowDimensions } from "react-native";
import type { InternalRendererProps, TBlock } from "react-native-render-html";
import { useInternalRenderer } from "react-native-render-html";

import ImageModal from "#/components/media/ImageModal";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const ImageRenderer = (properties: InternalRendererProps<TBlock>) => {
  const [ratio, setRatio] = useState(1.5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { rendererProps } = useInternalRenderer("img", properties);
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const uri = rendererProps.source.uri;
  const backgroundColor = Colors[colorScheme].background;

  const onLoad = (event: ImageLoadEventData) => {
    if (isLoaded) return;
    setIsLoaded(true);
    const { width, height } = event.source;
    const _ratio = Math.round((height / width) * 100) / 100;
    if (ratio !== _ratio) setRatio(_ratio);
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.centered}
      onPress={() => setIsModalOpen(true)}
    >
      <Image
        onLoad={onLoad}
        source={{ uri }}
        style={{ width, height: width * ratio, backgroundColor }}
      />
      <ImageModal
        uri={uri}
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Pressable>
  );
};

export default ImageRenderer;
