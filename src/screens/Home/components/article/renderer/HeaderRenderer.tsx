import { RefObject, useEffect, useRef } from "react";
import { View } from "react-native";
import {
  InternalRendererProps,
  TText,
  useInternalRenderer,
} from "react-native-render-html";

interface HeaderRendererProperties extends InternalRendererProps<TText> {
  componentRefs: RefObject<Record<string, unknown>>;
}
/**
 * Renders a html header element
 * The header element is used to create a reference to the header element
 * This is useful for jumping to link anchors
 * @param {HeaderRendererProperties} properties - The properties of the header renderer
 * @returns {ReactElement} The rendered header element
 */
const HeaderRenderer = (properties: HeaderRendererProperties) => {
  const { rendererProps, Renderer } = useInternalRenderer("h2", properties);
  const { componentRefs } = properties;
  const id = rendererProps.tnode.attributes.id;

  useEffect(() => {
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
