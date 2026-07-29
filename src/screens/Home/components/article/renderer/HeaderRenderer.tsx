import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import type { InternalRendererProps, TText } from "react-native-render-html";
import { useInternalRenderer } from "react-native-render-html";

interface HeaderRendererProperties extends InternalRendererProps<TText> {
  componentRefs: RefObject<Record<string, unknown>>;
}
/**
 * Renders a html header element (h2/h3)
 * The header element is used to create a reference to the header element
 * This is useful for jumping to link anchors, e.g. from a table of contents
 * at the start of the article or from an anchored deep link
 * @param {HeaderRendererProperties} properties - The properties of the header renderer
 * @returns {ReactElement} The rendered header element
 */
const HeaderRenderer = (properties: HeaderRendererProperties) => {
  // The same renderer is registered for every heading level that can carry
  // an anchor id; render with the node's own tag so styling stays per-level.
  const tag = properties.tnode.tagName as "h2" | "h3";
  const { rendererProps, Renderer } = useInternalRenderer(tag, properties);
  const { componentRefs } = properties;
  const id = rendererProps.tnode.attributes.id;

  useEffect(() => {
    if (!id) return;
    componentRefs.current[id] = thisReference;
  }, [componentRefs, id]);

  const thisReference = useRef(null);
  return (
    <View ref={thisReference}>
      <Renderer {...rendererProps} />
    </View>
  );
};

export default HeaderRenderer;
