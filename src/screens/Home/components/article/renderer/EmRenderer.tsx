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
        { fontFamily: resolvedFontFamily },
      ]}
    />
  );
};

export default EmRenderer;
