import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import type { InternalRendererProps, TBlock } from "react-native-render-html";
import { useInternalRenderer } from "react-native-render-html";

import ImageCreditBadge from "#/components/posts/ImageCreditBadge";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { HttpsUrl, ImageCredit } from "#/types";

interface ImageRendererProperties extends InternalRendererProps<TBlock> {
  url?: HttpsUrl;
}

const ImageRenderer = ({ url, ...properties }: ImageRendererProperties) => {
  const [ratio, setRatio] = useState(1.5);
  const [isLoaded, setIsLoaded] = useState(false);
  const [credit, setCredit] = useState<ImageCredit | undefined>();
  const { rendererProps } = useInternalRenderer("img", properties);
  const { width } = useWindowDimensions();
  const colorScheme = useAppColorScheme();
  const uri = rendererProps.source.uri;
  const backgroundColor = Colors[colorScheme].background;
  const router = useRouter();

  // WordPress tags content images with their attachment id via a
  // wp-image-{id} class; that id leads to the Image Source Control credit.
  const mediaId = /wp-image-(\d+)/.exec(
    properties.tnode.attributes?.class ?? "",
  )?.[1];

  useEffect(() => {
    if (!mediaId || !url) return;
    const controller = new AbortController();

    WordPressAPI.getMediaCredit(mediaId, url, controller.signal)
      .then((_credit) => {
        if (!controller.signal.aborted) setCredit(_credit);
      })
      .catch(() => {
        // Image just renders without a credit badge.
      });

    return () => {
      controller.abort();
    };
  }, [mediaId, url]);

  const onLoad = (event: ImageLoadEventData) => {
    if (isLoaded) return;
    setIsLoaded(true);
    const { width, height } = event.source;
    const _ratio = Math.round((height / width) * 100) / 100;
    if (ratio !== _ratio) setRatio(_ratio);
  };

  return (
    <View style={globalStyles.centered}>
      <UiPressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/image", params: { uri } })}
      >
        <Image
          onLoad={onLoad}
          source={{ uri }}
          style={{ width, height: width * ratio, backgroundColor }}
        />
      </UiPressable>
      <ImageCreditBadge credit={credit} position="bottomRight" />
    </View>
  );
};

export default ImageRenderer;
