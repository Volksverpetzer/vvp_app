import { iframeModel } from "@native-html/iframe-plugin";
import type {
  CustomTagRendererRecord,
  Element,
  HTMLSourceDom,
  InternalRendererProps,
  TBlock,
  TDocument,
  TNode,
} from "@native-html/render";
import {
  RenderHTMLConfigProvider,
  RenderHTMLSource,
  TRenderEngineProvider,
  defaultHTMLElementModels,
  useAmbientTRenderEngine,
} from "@native-html/render";
import type { ChildNode, Document } from "domhandler";
import type { RefObject } from "react";
import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GestureResponderEvent, View } from "react-native";

import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { fontFamily } from "#/constants/FontFamily";
import { SOURCE_SANS_FONTS } from "#/constants/GlobalStyles";
import Statistics from "#/helpers/Statistics";
import SourcesStore from "#/helpers/Stores/SourcesStore";
import { decodeAnchor } from "#/helpers/utils/anchors";
import { getTagStyles } from "#/helpers/utils/articleTagStyles";
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
import {
  BodyChunkOffsetContext,
  chunkIndexOfId,
  splitIntoChunks,
} from "./bodyChunks";
import { wrapLooseText } from "./looseText";

const IGNORED_DOM_TAGS = ["script", "style", "noscript", "input"];
const DEFAULT_TEXT_PROPS = {
  selectable: true,
  android_hyphenationFrequency: "normal",
} as const;

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
  /** Decoded id of a deep-link target; its part of the body renders first. */
  anchor?: string;
  /** Called (in a layout effect) once the whole body has been rendered. */
  onRendered?: () => void;
}

/**
 * Pause after the first chunk before rendering the rest: one frame, so the
 * first chunk is on screen first.
 */
const REST_DELAY_MS = 16;

const bodyOf = (tree: TDocument): TNode | undefined =>
  tree.children.find((child) => child.tagName === "body");

interface ChunkProperties {
  dom: Document;
  width: number;
  getOffset: () => number;
  onTTreeChange: (tree: TDocument) => void;
}

const Chunk = React.memo(function Chunk({
  dom,
  width,
  getOffset,
  onTTreeChange,
}: ChunkProperties) {
  const source = useMemo(
    // The DOM comes from the engine's own parser (via the app's newer
    // domhandler types, which describe the same objects).
    () => ({ dom: dom as unknown as HTMLSourceDom["dom"] }),
    [dom],
  );
  return (
    <BodyChunkOffsetContext.Provider value={getOffset}>
      <RenderHTMLSource
        source={source}
        contentWidth={width}
        onTTreeChange={onTTreeChange}
      />
    </BodyChunkOffsetContext.Provider>
  );
});

interface ChunkedSourceProperties {
  html: string;
  width: number;
  anchor?: string;
  onRendered?: () => void;
}

/**
 * Renders the article body in two steps: the first chunk of top-level blocks
 * right away, all further chunks a frame later. Building and mounting the
 * whole body of a long article at once (~2000 top-level blocks on the AfD
 * chronology) blocked the JS thread for ~7 s in a release build before
 * anything showed up; now the top of the article shows after ~0.3 s.
 *
 * The rest goes in a single step on purpose: every commit re-lays out and
 * diffs the whole body mounted so far, so rendering it in many small steps
 * took 2-3x as long in total (15-21 s instead of ~6 s).
 *
 * The chunk containing a deep-link anchor, and all chunks before it, render
 * immediately so the anchor can be aligned.
 */
const ChunkedSource = ({
  html,
  width,
  anchor,
  onRendered,
}: ChunkedSourceProperties) => {
  const engine = useAmbientTRenderEngine();
  const chunks = useMemo(
    () =>
      splitIntoChunks(
        wrapLooseText(engine.parseDocument(html) as unknown as Document),
      ),
    [engine, html],
  );
  const anchorChunk = useMemo(
    () => chunkIndexOfId(chunks, anchor),
    [chunks, anchor],
  );
  // The HTML the rest was rendered for: a new body starts from the first
  // chunk again instead of mounting in one blocking pass. A rebuilt engine
  // (e.g. a theme switch) keeps the whole body mounted, so a reader further
  // down isn't dropped back to the top while the lower chunks re-render.
  const [restRenderedFor, setRestRenderedFor] = useState<string>();
  const restRendered = restRenderedFor === html;
  const visibleCount = restRendered
    ? chunks.length
    : Math.min(chunks.length, Math.max(1, anchorChunk + 1));

  useEffect(() => {
    if (visibleCount >= chunks.length) return;
    const timeout = setTimeout(
      // A transition, so React renders the rest in time slices that touch
      // handling can interrupt; only the final commit blocks.
      () => startTransition(() => setRestRenderedFor(html)),
      REST_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [visibleCount, chunks.length, html]);

  useLayoutEffect(() => {
    if (visibleCount >= chunks.length) onRendered?.();
  }, [visibleCount, chunks.length, onRendered]);

  // Top-level block count of each built chunk, for BodyChunkOffsetContext.
  const blockCounts = useRef<number[]>([]);
  const chunkCallbacks = useMemo(
    () =>
      chunks.map((_, index) => ({
        getOffset: () =>
          blockCounts.current
            .slice(0, index)
            .reduce((sum, count) => sum + (count ?? 0), 0),
        onTTreeChange: (tree: TDocument) => {
          blockCounts.current[index] = bodyOf(tree)?.children.length ?? 0;
        },
      })),
    [chunks],
  );

  return (
    <>
      {chunks.slice(0, visibleCount).map((dom, index) => (
        <Chunk
          key={index}
          dom={dom}
          width={width}
          getOffset={chunkCallbacks[index].getOffset}
          onTTreeChange={chunkCallbacks[index].onTTreeChange}
        />
      ))}
    </>
  );
};

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
    anchor,
    onRendered,
  } = properties;
  const colorScheme = useAppColorScheme();

  const articleTagStyles = useMemo(
    () => getTagStyles(colorScheme),
    [colorScheme],
  );

  // Memoized like renderersProperties below: @native-html/render can
  // remount custom-rendered elements when this prop's identity changes,
  // which for the iframe renderer means remounting the embedded WebView —
  // visible as a reload/black-frame flash on an embedded YouTube video
  // every time Body re-renders for any reason (e.g. an unrelated ancestor
  // state update during scroll).
  const renderers: CustomTagRendererRecord = useMemo(
    () => ({
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
    }),
    [width, maxWidth, onLinkPress, article_link, headerRefs],
  );

  const customHTMLElementModels = useMemo(
    () => ({
      iframe: iframeModel,
      figcaption: defaultHTMLElementModels.p,
      figure: defaultHTMLElementModels.div,
    }),
    [],
  );

  // A tapped in-article anchor may point into a chunk that isn't rendered
  // yet; render up to it like a deep-link anchor.
  const [tappedAnchor, setTappedAnchor] = useState<string>();
  useEffect(() => setTappedAnchor(undefined), [anchor]);
  const handleAnchorPress = useCallback(
    (id: string) => {
      setTappedAnchor(id);
      onAnchorPress(id);
    },
    [onAnchorPress],
  );

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
              handleAnchorPress(decodeAnchor(href.split("#")[1] ?? ""));
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
    [article_link, article_title, handleAnchorPress, onLinkPress, slug],
  );

  /**
   * Processes HTML elements and removes unwanted elements from the DOM
   * @param {ChildNode & Element} element - The HTML element to process
   */
  const domVisitors = useMemo(
    () => ({
      onElement: (element: ChildNode & Element) => {
        const domElement = element;
        if (handleEmbeddedContent(domElement)) return;
        if (handleRemovableElements(domElement)) return;
        if (handleSpecialElements(domElement)) return;
        if (handleContainerElements(domElement)) return;
        handleImageElements(domElement);
      },
    }),
    [],
  );

  // Memoized: the render engine is rebuilt (and the whole body re-parsed)
  // whenever any of its config props changes identity.
  const baseStyle = useMemo(
    () => ({
      fontFamily: fontFamily.regular,
      maxWidth: maxWidth,
      color: Colors[colorScheme].text,
    }),
    [maxWidth, colorScheme],
  );

  return (
    <TRenderEngineProvider
      tagsStyles={articleTagStyles}
      ignoredDomTags={IGNORED_DOM_TAGS}
      systemFonts={SOURCE_SANS_FONTS}
      customHTMLElementModels={customHTMLElementModels}
      domVisitors={domVisitors}
      // Every visual style comes from tagsStyles/baseStyle/the custom
      // renderers below — nothing implicit from the engine's own default
      // stylesheet. That default stylesheet isn't part of this library's
      // public API and silently differs between versions (a heading lost
      // its bold weight and margin across an engine bump, even though our
      // own tagsStyles for it hadn't changed) — disabling it removes that
      // whole class of upgrade risk.
      enableUserAgentStyles={false}
      baseStyle={baseStyle}
    >
      <RenderHTMLConfigProvider
        renderers={renderers}
        renderersProps={renderersProperties}
        defaultTextProps={DEFAULT_TEXT_PROPS}
      >
        <ChunkedSource
          html={article_content}
          width={width}
          anchor={tappedAnchor ?? anchor}
          onRendered={onRendered}
        />
      </RenderHTMLConfigProvider>
    </TRenderEngineProvider>
  );
};

export default React.memo(Body);
