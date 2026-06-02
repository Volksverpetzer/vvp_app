import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useWindowDimensions } from "react-native";
import type { InternalRendererProps, TBlock } from "react-native-render-html";
import { useInternalRenderer } from "react-native-render-html";

import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

const ImageRenderer = (properties: InternalRendererProps<TBlock>) => {
  const [ratio, setRatio] = useState(1.5);
  const [isLoaded, setIsLoaded] = useState(false);
  const { rendererProps } = useInternalRenderer("img", properties);
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const uri = rendererProps.source.uri;
  const backgroundColor = Colors[colorScheme].background;
  const router = useRouter();

  const onLoad = (event: ImageLoadEventData) => {
    if (isLoaded) return;
    setIsLoaded(true);
    const { width, height } = event.source;
    const _ratio = Math.round((height / width) * 100) / 100;
    if (ratio !== _ratio) setRatio(_ratio);
  };

  return (
    <UiPressable
      accessibilityRole="button"
      style={globalStyles.centered}
      onPress={() => router.push({ pathname: "/image", params: { uri } })}
    >
      <Image
        onLoad={onLoad}
        source={{ uri }}
        style={{ width, height: width * ratio, backgroundColor }}
      />
    </UiPressable>
  );
};

export default ImageRenderer;
