import type { InternalRendererProps, TText } from "@native-html/render";
import { useInternalRenderer } from "@native-html/render";
import type { TextStyle } from "react-native";

import { fontFamily } from "#/constants/FontFamily";

const EmRenderer = (properties: InternalRendererProps<TText>) => {
  const { rendererProps, Renderer } = useInternalRenderer("em", properties);
  const parentFontFamily =
    properties.tnode.parent?.styles?.nativeTextFlow?.fontFamily;
  const resolvedFontFamily =
    parentFontFamily === fontFamily.bold
      ? fontFamily.boldItalic
      : fontFamily.italic;
  return (
    <Renderer
      {...rendererProps}
      style={[
        rendererProps.style as TextStyle,
        // fontStyle: "normal" cancels the engine's UA-default italic for
        // <em> — resolvedFontFamily is already an italic-cut font file, and
        // stacking the synthetic oblique on top of it on Android changes
        // glyph advance widths (tighter wrapping) without changing fontSize.
        { fontFamily: resolvedFontFamily, fontStyle: "normal" },
      ]}
    />
  );
};

export default EmRenderer;
