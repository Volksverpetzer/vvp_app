import { iframeModel } from "@native-html/iframe-plugin";
import type { ChildNode } from "domhandler";
import React, { RefObject, useMemo, useRef } from "react";
import { GestureResponderEvent, ScrollView } from "react-native";
import { View } from "react-native-reanimated/lib/typescript/Animated";
import RenderHtml, {
  CustomTagRendererRecord,
  Element,
  InternalRendererProps,
  TBlock,
  defaultHTMLElementModels,
} from "react-native-render-html";
import BlockRenderer from "src/screens/Home/components/article/renderer/BlockRenderer";
import HeaderRenderer from "src/screens/Home/components/article/renderer/HeaderRenderer";
import IframeRenderer from "src/screens/Home/components/article/renderer/IframeRenderer";
import ImageRenderer from "src/screens/Home/components/article/renderer/ImageRenderer";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import Statistics from "#/helpers/Statistics";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import useAppColorScheme from "#/hooks/useAppColorScheme";
import { HttpsUrl } from "#/types";

import {
  handleContainerElements,
  handleEmbeddedContent,
  handleImageElements,
  handleRemovableElements,
  handleSpecialElements,
} from "./ElementHandlers";
import tagStylesFunction from "./tagStyles";

interface BodyProperties {
  article_content: string;
  article_link: HttpsUrl;
  slug: string;
  article_title: string;
  onLinkPress: (event: GestureResponderEvent, href: string) => void;
  width: number;
  maxWidth: number;
  scrollRef: RefObject<ScrollView>;
}

/**
 * Renders the body of an article
 * @param {BodyProperties} properties - The properties of the article body
 * @returns
 */
const Body = (properties: BodyProperties) => {
  const {
    article_content,
    article_link,
    width,
    maxWidth,
    onLinkPress,
    scrollRef,
    slug,
    article_title,
  } = properties;
  const colorScheme = useAppColorScheme();

  const articleTagStyles = useMemo(
    () => tagStylesFunction(colorScheme, width),
    [colorScheme, width],
  );

  const headerReferences = useRef<Record<string, RefObject<View>>>({});

  const renderers: CustomTagRendererRecord = {
    iframe: (renderProperties) =>
      IframeRenderer({
        renderProps: renderProperties,
        width,
        maxWidth,
        onLinkPress: onLinkPress,
      }),
    p: (renderProperties) =>
      BlockRenderer({ renderProps: renderProperties, url: article_link }),
    img: (renderProperties: InternalRendererProps<TBlock>) =>
      ImageRenderer({ ...renderProperties }),
    h2: (renderProperties) =>
      HeaderRenderer({ ...renderProperties, componentRefs: headerReferences }),
    blockquote: (renderProperties) =>
      BlockRenderer({ renderProps: renderProperties, url: article_link }),
  };

  const customHTMLElementModels = {
    iframe: iframeModel,
    figcaption: defaultHTMLElementModels.p,
    figure: defaultHTMLElementModels.div,
  };

  const renderersProperties = useMemo(
    () => ({
      a: {
        /**
         * Handles link presses in the rendered HTML content
         * @param {GestureResponderEvent} event - The event object
         * @param {string} href - The URL of the link
         */
        onPress: (event: GestureResponderEvent, href: string) => {
          if (
            href.includes(article_link) ||
            href.startsWith("about:///blank#")
          ) {
            if (href.includes("#")) {
              const id = href.split("#")[1];
              const reference = headerReferences.current[id];
              if (reference) {
                reference.current.measureLayout(
                  scrollRef.current.getInnerViewNode(),
                  (x, y) => {
                    scrollRef.current.scrollTo({ y: y, animated: false });
                  },
                );
              }
            }
            return;
          }
          if (href.startsWith("https://") && !href.includes(Config.wpUrl)) {
            SourcesStore.onAddSource(href as HttpsUrl, slug, article_title);
            Statistics.countSourceChecked();
          }
          onLinkPress(event, href);
        },
      },
    }),
    [article_link, article_title, onLinkPress, scrollRef, slug],
  );

  /**
   * Processes HTML elements and removes unwanted elements from the DOM
   * @param {ChildNode & Element} element - The HTML element to process
   * @returns {void}
   */
  const onElement = (element: ChildNode & Element) => {
    const domElement = element;
    if (handleEmbeddedContent(domElement, maxWidth)) return;
    if (handleRemovableElements(domElement)) return;
    if (handleSpecialElements(domElement)) return;
    if (handleContainerElements(domElement)) return;
    handleImageElements(domElement);
  };

  return (
    <RenderHtml
      source={{ html: article_content.replace(/<style>.*<\/style>/s, "") }}
      renderers={renderers}
      tagsStyles={articleTagStyles}
      ignoredDomTags={["script", "style", "noscript", "input"]}
      renderersProps={renderersProperties}
      defaultTextProps={{ selectable: true }}
      systemFonts={["SourceSansPro"]}
      contentWidth={width}
      customHTMLElementModels={customHTMLElementModels}
      domVisitors={{ onElement }}
      baseStyle={{
        fontFamily: "SourceSansPro",
        lineHeight: 27,
        maxWidth: maxWidth,
        color: Colors[colorScheme].text,
      }}
    />
  );
};

export default React.memo(Body);
