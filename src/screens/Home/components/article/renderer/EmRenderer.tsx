import type { InternalRendererProps, TText } from "react-native-render-html";
import { useInternalRenderer } from "react-native-render-html";

const EmRenderer = (properties: InternalRendererProps<TText>) => {
  const { rendererProps, Renderer } = useInternalRenderer("em", properties);
  const parentFontFamily =
    properties.tnode.parent?.styles?.nativeTextFlow?.fontFamily;
  const fontFamily =
    parentFontFamily === "SourceSansProBold"
      ? "SourceSansProBoldItalic"
      : "SourceSansProItalic";
  return (
    <Renderer
      {...rendererProps}
      style={[rendererProps.style, { fontFamily }]}
    />
  );
};

export default EmRenderer;
