import { iframeModel } from "@native-html/iframe-plugin";
import type { ChildNode } from "domhandler";
import type { RefObject } from "react";
import React, { useMemo } from "react";
import type { GestureResponderEvent, View } from "react-native";
import type {
  CustomTagRendererRecord,
  Element,
  InternalRendererProps,
  TBlock,
} from "react-native-render-html";
import RenderHtml, { defaultHTMLElementModels } from "react-native-render-html";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { CONTENT_LINE_HEIGHT } from "#/constants/FontSizes";
import { SOURCE_SANS_FONTS } from "#/constants/GlobalStyles";
import Statistics from "#/helpers/Statistics";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { decodeAnchor } from "#/helpers/utils/anchors";
import { getTagStyles } from "#/helpers/utils/color";
import { isSameHost } from "#/helpers/utils/host";
import { isHttpsUrl } from "#/helpers/utils/networking";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import BlockRenderer from "#/screens/Home/components/article/renderer/BlockRenderer";
import EmRenderer from "#/screens/Home/components/article/renderer/EmRenderer";
import FigcaptionRenderer from "#/screens/Home/components/article/renderer/FigcaptionRenderer";
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
  onLinkPress: (event: GestureResponderEvent, href: HttpsUrl) => void;
  width: number;
  maxWidth: number;
  /** Header refs by HTML id, owned by ArticleScreen (also used for deep-link anchors). */
  headerRefs: RefObject<Record<string, RefObject<View>>>;
  /** Scrolls the article to the header with the given (decoded) anchor id. */
  onAnchorPress: (id: string) => void;
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
    headerRefs,
    onAnchorPress,
    slug,
    article_title,
  } = properties;
  const colorScheme = useAppColorScheme();

  const articleTagStyles = useMemo(
    () => getTagStyles(colorScheme),
    [colorScheme],
  );

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
      ImageRenderer({ ...renderProperties, url: article_link }),
    figcaption: (renderProperties: InternalRendererProps<TBlock>) =>
      FigcaptionRenderer({ ...renderProperties, url: article_link }),
    h2: (renderProperties) =>
      HeaderRenderer({ ...renderProperties, componentRefs: headerRefs }),
    // h3 anchors are common table-of-contents targets (wp-block-heading ids).
    h3: (renderProperties) =>
      HeaderRenderer({ ...renderProperties, componentRefs: headerRefs }),
    blockquote: (renderProperties) =>
      BlockRenderer({ renderProps: renderProperties, url: article_link }),
    em: (renderProperties) => EmRenderer(renderProperties),
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
              // Fragments in hrefs may be percent-encoded (e.g. a trailing
              // %20), while header ids are raw text — decode once to match.
              onAnchorPress(decodeAnchor(href.split("#")[1] ?? ""));
            }
            return;
          }
          if (!isHttpsUrl(href)) return;
          if (!isSameHost(href, Config.wpUrl) && Config.enableEngagement) {
            SourcesStore.onAddSource(href, slug, article_title);
            Statistics.countSourceChecked();
          }
          onLinkPress(event, href);
        },
      },
    }),
    [article_link, article_title, onAnchorPress, onLinkPress, slug],
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
      systemFonts={SOURCE_SANS_FONTS}
      contentWidth={width}
      customHTMLElementModels={customHTMLElementModels}
      domVisitors={{ onElement }}
      baseStyle={{
        fontFamily: "SourceSansPro",
        lineHeight: CONTENT_LINE_HEIGHT,
        maxWidth: maxWidth,
        color: Colors[colorScheme].text,
      }}
    />
  );
};

export default React.memo(Body);
