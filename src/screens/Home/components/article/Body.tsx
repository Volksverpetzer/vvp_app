import { iframeModel } from "@native-html/iframe-plugin";
import type { ChildNode } from "domhandler";
import type { RefObject } from "react";
import React, { useMemo, useRef } from "react";
import type { GestureResponderEvent, ScrollView } from "react-native";
import type { View } from "react-native-reanimated/lib/typescript/Animated";
import type {
  CustomTagRendererRecord,
  Element,
  InternalRendererProps,
  TBlock,
} from "react-native-render-html";
import RenderHtml, { defaultHTMLElementModels } from "react-native-render-html";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import Statistics from "#/helpers/Statistics";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { getTagStyles } from "#/helpers/utils/color";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import BlockRenderer from "#/screens/Home/components/article/renderer/BlockRenderer";
import HeaderRenderer from "#/screens/Home/components/article/renderer/HeaderRenderer";
import IframeRenderer from "#/screens/Home/components/article/renderer/IframeRenderer";
import ImageRenderer from "#/screens/Home/components/article/renderer/ImageRenderer";
import type { HttpsUrl } from "#/types";

import {
  handleContainerElements,
  handleEmbeddedContent,
  handleImageElements,
  handleRemovableElements,
  handleSpecialElements,
} from "./ElementHandlers";

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
    () => getTagStyles(colorScheme),
    [colorScheme],
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
          if (
            href.startsWith("https://") &&
            !href.includes(Config.wpUrl) &&
            Config.enableEngagement
          ) {
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
   */
  const onElement = (element: ChildNode & Element) => {
    const domElement = element;
    if (handleEmbeddedContent(domElement)) return;
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
