import { View } from "react-native";
import type { InternalRendererProps, TBlock } from "react-native-render-html";

import ImageCreditBadge from "#/components/posts/ImageCreditBadge";
import { MIN_TOUCH_TARGET } from "#/constants/IconSizes";
import { useImageCredit } from "#/hooks/useImageCredit";
import type { HttpsUrl } from "#/types";

import { findImageTNode, mediaIdOf } from "./imageCreditNodes";

interface FigcaptionRendererProperties extends InternalRendererProps<TBlock> {
  url?: HttpsUrl;
}

/**
 * Renders a figure caption with the sibling image's credit badge overlaid on
 * the caption row, so caption text and credit share the line below the image.
 */
const FigcaptionRenderer = ({
  url,
  ...properties
}: FigcaptionRendererProperties) => {
  const { TDefaultRenderer, ...defaultProperties } = properties;
  const image = findImageTNode(properties.tnode.parent ?? undefined);
  const credit = useImageCredit(mediaIdOf(image), url);

  // Inset the centered caption by the badge's touch target on both sides so the
  // text/link never sits under the top-right badge or has its taps intercepted.
  // Only reserve the space when there's actually a credit to show.
  const inset = credit ? MIN_TOUCH_TARGET : 0;

  return (
    <View style={{ paddingHorizontal: inset }}>
      <TDefaultRenderer {...defaultProperties} />
      <ImageCreditBadge credit={credit} position="topRight" />
    </View>
  );
};

export default FigcaptionRenderer;
