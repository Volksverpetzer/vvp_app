import type { InternalRendererProps, TBlock } from "@native-html/render";
import { useInternalRenderer } from "@native-html/render";
import type { ImageLoadEventData } from "expo-image";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import ImageCreditBadge from "#/components/posts/ImageCreditBadge";
import UiPressable from "#/components/ui/UiPressable";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import { useImageCredit } from "#/hooks/useImageCredit";
import type { HttpsUrl } from "#/types";

import { hasFigcaptionSibling, mediaIdOf } from "./imageCreditNodes";

interface ImageRendererProperties extends InternalRendererProps<TBlock> {
  url?: HttpsUrl;
}

const ImageRenderer = ({ url, ...properties }: ImageRendererProperties) => {
  const [ratio, setRatio] = useState(1.5);
  const [isLoaded, setIsLoaded] = useState(false);
  const { rendererProps } = useInternalRenderer("img", properties);
  // The article body's rendered width, not the window's — on wide/desktop
  // viewports the content column is narrower than the window, and sizing
  // off the window made images overflow their container.
  const { width } = useFeedDimensions();
  const colorScheme = useAppColorScheme();
  const uri = rendererProps.source.uri;
  const backgroundColor = Colors[colorScheme].background;
  const router = useRouter();

  // When the image has a caption, FigcaptionRenderer shows the credit badge
  // on the caption row instead of overlaying it on the image.
  const hasCaption = hasFigcaptionSibling(properties.tnode);
  const credit = useImageCredit(
    hasCaption ? undefined : mediaIdOf(properties.tnode),
    url,
  );

  const onLoad = (event: ImageLoadEventData) => {
    if (isLoaded) return;
    setIsLoaded(true);
    const { width, height } = event.source;
    const _ratio = Math.round((height / width) * 100) / 100;
    // Malformed image metadata (e.g. width 0) would otherwise produce an
    // Infinity/NaN aspectRatio and break layout — keep the existing
    // fallback ratio instead.
    if (Number.isFinite(_ratio) && _ratio > 0 && ratio !== _ratio) {
      setRatio(_ratio);
    }
  };

  return (
    // flex: 0 so the wrapper hugs the image height; otherwise the absolutely
    // positioned badge could sit below the image in a taller container.
    // A figcaption already carries its own paddingBottom, so a captioned
    // image only needs a small gap here — stacking the full spacing on
    // both nearly doubled the gap after a captioned image (see
    // articleTagStyles.ts).
    <View
      style={[
        globalStyles.centered,
        { flex: 0, marginBottom: hasCaption ? spacing.xs : spacing.xl },
      ]}
    >
      <UiPressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/image", params: { uri } })}
      >
        <Image
          onLoad={onLoad}
          source={{ uri }}
          style={{ width, aspectRatio: 1 / ratio, backgroundColor }}
        />
      </UiPressable>
      <ImageCreditBadge credit={credit} position="bottomRight" />
    </View>
  );
};

export default ImageRenderer;
