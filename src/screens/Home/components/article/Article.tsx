import { useRouter } from "expo-router";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Animated, ScrollView, View, useWindowDimensions } from "react-native";

import NavBar from "#/components/bars/NavBar";
import BackToTopButton from "#/components/buttons/BackToTopButton";
import Footer from "#/components/views/Footer";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { globalStyles } from "#/constants/GlobalStyles";
import { Achievements } from "#/helpers/Achievements";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import Statistics from "#/helpers/Statistics";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { registerEvent } from "#/helpers/network/Analytics";
import { registerViews } from "#/helpers/network/Engagement";
import { findSecondaryWpFeed } from "#/helpers/utils/feeds";
import { stripVisualComposerShortcodes } from "#/helpers/utils/posts";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useBackToTop } from "#/hooks/useBackToTop";
import type { ArticleProperties, HttpsUrl } from "#/types";

import Body from "./Body";
import Header from "./Header";
import Recommended from "./Recommended";

// How long a deep-link anchor keeps re-aligning the view as async content
// (images, embeds) resizes the article above it. Ends early on the first user
// scroll; this is the hard cap for platforms/inputs that don't signal that.
const ANCHOR_ALIGN_WINDOW_MS = 4000;

interface ArticleScreenProperties {
  article: ArticleProperties;
  /** Decoded URL fragment of the deep link (e.g. "quellen") to scroll to. */
  anchor?: string;
}

/**
 * Renders an Article from WordPress API Data in Route Param Props
 *
 * Handles scrolling by rendering a progress bar and saving scroll position
 * to local storage. Also triggers "FullRead" analytics event when user
 * scrolls 70% down the article.
 *
 * @param {ArticleProperties} properties - Article data from WordPress API
 * @returns
 */
const ArticleScreen = (properties: ArticleScreenProperties) => {
  const { article, anchor } = properties;
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const scrollProgress = useRef(new Animated.Value(0)).current;
  const scrollReference = useRef<ScrollView>(null);
  // Ref to the ScrollView's inner content view; anchor positions are
  // measured against it (see scrollToAnchor).
  const innerViewReference = useRef<View>(null);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const backToTop = useBackToTop();
  const corporate = Colors[colorScheme].primary;
  const backgroundColor = Colors[colorScheme].background;

  const fullRead = useRef(false);
  const savedPosition = useRef(0);
  const heightCaptured = useRef(false);
  // Refs to rendered headers by their HTML id, registered by HeaderRenderer.
  // Used both for in-article anchor links and for deep links with a fragment.
  const headerReferences = useRef<Record<string, RefObject<View>>>({});
  // The anchor still waiting to be aligned. Content height keeps changing
  // while images load in, so we re-align on every content size change until
  // the user takes over scrolling (a one-shot scroll would land wrong).
  const pendingAnchor = useRef(anchor);
  const mounted = useRef(true);
  const slug = article.slug;
  const article_image = article.imageUrl;
  const article_title = article.title;
  const article_content = stripVisualComposerShortcodes(
    article.content?.rendered ?? "",
  );
  const article_link = article.link;
  const _date = new Date(article.date);
  const width = useWindowDimensions().width;

  const maxWidth = 700;
  const date =
    _date.getDate() + "." + (_date.getMonth() + 1) + "." + _date.getFullYear();

  /**
   * Scrolls to the header element registered under the given anchor id.
   * No-op when the id doesn't match a rendered header (e.g. the target
   * element isn't an h2), matching the behavior of in-article anchor links.
   * @param id The decoded HTML id of the target header
   */
  // useCallback (not just an extracted binding) is load-bearing here: this
  // project doesn't run the React Compiler (no "reactCompiler" experiment in
  // app.config.ts), so nothing else gives these a stable identity across
  // renders. Body's `renderers` prop is rebuilt from handleAnchorPress /
  // handleLinkPress on every render, and react-native-render-html can
  // remount custom-rendered elements (like the WebView inside an embedded
  // iframe) when that prop's identity changes — visible as a reload/
  // black-frame flash on an embedded video every time Article re-renders.
  const scrollToAnchor = useCallback((id: string) => {
    const headerNode = headerReferences.current[id]?.current;
    const scrollView = scrollReference.current;
    // On the new architecture measureLayout must receive the host component
    // ref itself — the node handle from getInnerViewNode() is rejected with
    // "must be called with a ref to a native component".
    const innerView = innerViewReference.current;
    if (!headerNode || !scrollView || !innerView) return;
    headerNode.measureLayout(innerView, (_x, y) => {
      scrollView.scrollTo({ y, animated: false });
    });
  }, []);

  const handleAnchorPress = useCallback(
    (id: string) => {
      // A tapped in-article anchor supersedes a deep-link anchor; otherwise
      // the next content resize would snap back to it.
      pendingAnchor.current = undefined;
      scrollToAnchor(id);
    },
    [scrollToAnchor],
  );

  const handleLinkPress = useCallback(
    (_event: GestureResponderEvent, href: HttpsUrl) =>
      onLinkPress(href, router, article_link),
    [router, article_link],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // A deep link to the already-open article updates the params on the
    // existing screen instance instead of remounting it — re-arm the pending
    // anchor and jump right away (no-op if the headers aren't laid out yet;
    // onRender/onContentSizeChange pick it up then).
    if (!anchor) return;
    pendingAnchor.current = anchor;
    scrollToAnchor(anchor);
    // Bound the auto-align window. It normally ends when the user starts
    // scrolling, but react-native-web never fires onScrollBeginDrag for
    // wheel scrolling, so without this the anchor would stay pending forever
    // on web — permanently suppressing read tracking and snapping the view
    // back on every late image load. Images settle well within this window.
    const timeout = setTimeout(() => {
      pendingAnchor.current = undefined;
    }, ANCHOR_ALIGN_WINDOW_MS);
    return () => clearTimeout(timeout);
  }, [anchor, scrollToAnchor]);

  useEffect(() => {
    registerViews(article_link);
    Statistics.countArticleRead();
    // Adoption signal for secondary WordPress feeds (currently only Prüfpunkt):
    // emit a distinct, countable event on the primary site so feed engagement
    // can be tracked alongside the rest of the app's analytics.
    const secondaryFeed = findSecondaryWpFeed(
      article_link,
      Config.wpUrl,
      Config.feeds?.wp,
    );
    if (secondaryFeed?.sourceName) {
      registerEvent(Config.wpUrl, "Pruefpunkt View", {
        source: secondaryFeed.sourceName,
        url: article_link,
      });
    }
  }, [article_link]);

  /**
   * Called once when the article layout is rendered.
   * Captures the content height and restores the scroll position saved in storage.
   * When the article was opened via an anchored deep link, jumps to the anchor
   * instead of restoring the saved reading position.
   * Prevents re-running after the first layout via heightCaptured flag.
   * @param event LayoutChangeEvent containing nativeEvent.layout.height
   */
  const onRender = (event: LayoutChangeEvent) => {
    if (heightCaptured.current) return;
    heightCaptured.current = true;
    const height = event.nativeEvent.layout.height;
    if (pendingAnchor.current) {
      // Try to align now; this is a no-op if the header refs aren't registered
      // yet (HeaderRenderer registers them in a passive effect whose flush
      // order vs. this native onLayout isn't guaranteed) — onContentSizeChange
      // retries once they are, and the align window eventually clears a
      // fragment that never matches. Skip the saved-position restore either
      // way: a deep-linked anchor takes precedence over resuming.
      scrollToAnchor(pendingAnchor.current);
      return;
    }
    PersonalStore.getScrollPosition(slug).then((progress) => {
      if (!mounted.current || progress > 0.8) return;
      savedPosition.current = progress;
      scrollReference.current?.scrollTo({
        y: height * progress,
        animated: false,
      });
    });
  };

  /**
   * Called during scrolling to update scroll progress and trigger analytics.
   * Tracks scroll progress and marks article as fully read when user scrolls 70% down.
   * Also triggers "FullRead" analytics event and reader achievement.
   * @param event ScrollEvent containing contentOffset.y and contentSize.height
   */
  const scrollListener = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    backToTop.onScroll(event);
    const progress =
      event.nativeEvent.contentOffset.y / event.nativeEvent.contentSize.height;
    scrollProgress.setValue(progress * 1.1 * width);
    // While the view is still auto-aligned on a deep-link anchor the scroll
    // events are programmatic, not reading: don't count a FullRead, don't
    // grant achievements, and don't clobber the saved reading position.
    if (pendingAnchor.current) return;
    if (progress > 0.7 && !fullRead.current) {
      fullRead.current = true;
      registerEvent(article_link, "FullRead");
      Achievements.setAchievementValue("reader", true);
    }
    if (Math.abs(progress - savedPosition.current) > 0.02) {
      savedPosition.current = progress;
      PersonalStore.setScrollPosition(progress, slug);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Animated.View
        style={{
          position: "absolute",
          zIndex: 30,
          height: 5,
          width: scrollProgress,
          backgroundColor: corporate,
        }}
      ></Animated.View>
      <View style={globalStyles.container}>
        <ScrollView
          testID="article-scroll"
          style={{
            backgroundColor,
          }}
          contentContainerStyle={[globalStyles.content]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            { useNativeDriver: false, listener: scrollListener },
          )}
          ref={scrollReference}
          innerViewRef={innerViewReference}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            // Re-align the pending anchor whenever async content (images,
            // embeds) resizes the article above it.
            if (pendingAnchor.current) scrollToAnchor(pendingAnchor.current);
          }}
          onScrollBeginDrag={() => {
            // The user took over — stop snapping back to the anchor.
            pendingAnchor.current = undefined;
          }}
        >
          <View onLayout={onRender} style={{ paddingBottom: 100 }}>
            <Header
              article={article}
              article_image={article_image}
              article_link={article_link}
              article_title={article_title}
              date={date}
              slug={slug}
            />
            <Body
              article_content={article_content}
              article_title={article_title}
              slug={slug}
              article_link={article_link}
              maxWidth={maxWidth}
              width={width}
              headerRefs={headerReferences}
              onAnchorPress={handleAnchorPress}
              onLinkPress={handleLinkPress}
            />
            <Recommended article_link={article_link}></Recommended>
            <Footer
              article_link={article_link}
              article_title={article_title}
              onShare={onShare}
            />
          </View>
        </ScrollView>
        <BackToTopButton
          visible={backToTop.visible}
          onPress={() => {
            // Back-to-top is explicit user navigation — it must win over a
            // still-pending deep-link anchor.
            pendingAnchor.current = undefined;
            scrollReference.current?.scrollTo({ y: 0, animated: true });
          }}
        />
      </View>
      <NavBar
        link={article_link}
        shareable={[{ url: article_link, title: article_title }]}
        contentFavIdentifier={slug}
        contentType="article"
      />
    </View>
  );
};

export default ArticleScreen;
