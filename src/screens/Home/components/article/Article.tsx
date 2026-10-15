import { useRouter } from "expo-router";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Animated, ScrollView, View, useWindowDimensions } from "react-native";

import NavBar from "#/components/bars/NavBar";
import BackToTopButton from "#/components/buttons/BackToTopButton";
import ReadingProgressBar from "#/components/progress/ReadingProgressBar";
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
import {
  findPageIndexForAnchor,
  findPageIndexForPageNumber,
  splitArticlePages,
  stripVisualComposerShortcodes,
} from "#/helpers/utils/posts";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useBackToTop } from "#/hooks/useBackToTop";
import {
  ScrollViewportContext,
  createScrollViewport,
} from "#/hooks/useNearViewport";
import type { ArticleProperties, HttpsUrl } from "#/types";

import {
  ArticlePageNavigation,
  ArticleTableOfContents,
} from "./ArticlePagination";
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
  /** Website page number of a paged deep link (`…/{slug}/3/`). */
  page?: number;
}

/**
 * Renders an Article from WordPress API Data in Route Param Props
 *
 * Handles scrolling by rendering a progress bar and saving scroll position
 * to local storage. Also triggers "FullRead" analytics event when user
 * scrolls 70% down the article (down its last page, for a paged one).
 *
 * Articles split into pages by WordPress `[nextpage]` shortcodes render one
 * page at a time, with a table of contents above and previous/next buttons
 * below the body.
 *
 * @param {ArticleProperties} properties - Article data from WordPress API
 * @returns
 */
const ArticleScreen = (properties: ArticleScreenProperties) => {
  const { article, anchor, page } = properties;
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const scrollProgress = useRef(new Animated.Value(0)).current;
  const scrollReference = useRef<ScrollView>(null);
  // Ref to the ScrollView's inner content view; anchor positions are
  // measured against it (see scrollToAnchor).
  const innerViewReference = useRef<View>(null);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const backToTop = useBackToTop();
  // Matches --vvp-accent, the progress-bar color used on the crowdfunding site.
  const progressColor = Colors[colorScheme].accent;
  const backgroundColor = Colors[colorScheme].background;

  const fullRead = useRef(false);
  const savedPosition = useRef(0);
  // Whether the saved reading position was restored — or no longer should
  // be, because the reader or a deep-link anchor already moved the view.
  const positionRestoreHandled = useRef(false);
  // Body renders long articles in chunks; until the last one is in, the
  // content height (and thus any scroll progress) is only partial.
  const bodyRendered = useRef(false);
  // Refs to rendered headers by their HTML id, registered by HeaderRenderer.
  // Used both for in-article anchor links and for deep links with a fragment.
  const headerReferences = useRef<Record<string, RefObject<View>>>({});
  // The anchor still waiting to be aligned. Content height keeps changing
  // while images load in, so we re-align on every content size change until
  // the user takes over scrolling (a one-shot scroll would land wrong).
  const pendingAnchor = useRef(anchor);
  const anchorAlignTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(true);
  // Latest content height, for restoring the position without waiting for
  // another content size change.
  const contentHeight = useRef(0);
  // The view above the body (table of contents, or the body itself); a page
  // change scrolls back to it.
  const pageStartReference = useRef<View>(null);
  const slug = article.slug;
  const article_image = article.imageUrl;
  const article_title = article.title;
  const rawContent = article.content?.rendered ?? "";
  // Memoized: long articles run to ~1 MB of HTML, and this screen re-renders
  // on every back-to-top visibility toggle while scrolling.
  const article_content = useMemo(
    () =>
      stripVisualComposerShortcodes(rawContent).replace(
        /<style>.*<\/style>/s,
        "",
      ),
    [rawContent],
  );
  const pages = useMemo(
    () => splitArticlePages(article_content),
    [article_content],
  );
  const isPaged = pages.length > 1;
  const [pageIndex, setPageIndex] = useState(() => {
    const anchorPage = findPageIndexForAnchor(pages, anchor ?? "");
    if (anchorPage >= 0) return anchorPage;
    return Math.max(page ? findPageIndexForPageNumber(pages, page) : -1, 0);
  });
  // Mirrors pageIndex for callbacks that must not change identity with it.
  const pageIndexReference = useRef(pageIndex);
  // Body's anchor prop: the part of the page containing it renders first.
  const [pageAnchor, setPageAnchor] = useState(anchor);
  // Whether the page the reader was last on is still being looked up; the
  // saved position within the page waits for it.
  const pageRestorePending = useRef(isPaged && !anchor && !page);
  // The page resumed from storage, whose saved position must survive.
  const restoredPage = useRef<number>(undefined);
  const currentPage = Math.min(pageIndex, pages.length - 1);
  const isLastPage = currentPage === pages.length - 1;
  const article_link = article.link;
  const _date = new Date(article.date);
  const { width, height: windowHeight } = useWindowDimensions();
  // Lets article content (e.g. embedded article cards) defer work until the
  // reader scrolls near it.
  const viewport = useMemo(
    () => createScrollViewport(innerViewReference, windowHeight),
    // Only the initial height matters; scroll events report the real one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const maxWidth = 700;
  const date =
    _date.getDate() + "." + (_date.getMonth() + 1) + "." + _date.getFullYear();

  /**
   * Scrolls to the header element registered under the given anchor id.
   * No-op when the id doesn't match a rendered header (e.g. the target
   * element isn't an h2), matching the behavior of in-article anchor links.
   * @param id The decoded HTML id of the target header
   * @returns Whether the header is rendered
   */
  // useCallback (not just an extracted binding) is load-bearing here: this
  // project doesn't run the React Compiler (no "reactCompiler" experiment in
  // app.config.ts), so nothing else gives these a stable identity across
  // renders. Body's `renderers` prop is rebuilt from handleAnchorPress /
  // handleLinkPress on every render, and @native-html/render can
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
    if (!headerNode || !scrollView || !innerView) return false;
    headerNode.measureLayout(innerView, (_x, y) => {
      scrollView.scrollTo({ y, animated: false });
    });
    return true;
  }, []);

  /**
   * Scrolls to the anchor now if it's rendered, and keeps re-aligning on it
   * as content above it resizes (or, for an anchor in a not yet rendered
   * part of the body, once it renders) until the reader scrolls.
   */
  const alignToAnchor = useCallback(
    (id: string) => {
      pendingAnchor.current = id;
      // Jumping to an anchor replaces resuming the saved reading position.
      positionRestoreHandled.current = true;
      scrollToAnchor(id);
      // Bound the auto-align window. It normally ends when the user starts
      // scrolling, but react-native-web never fires onScrollBeginDrag for
      // wheel scrolling, so without this the anchor would stay pending
      // forever on web — permanently suppressing read tracking and snapping
      // the view back on every late image load. Images settle well within
      // this window.
      clearTimeout(anchorAlignTimeout.current);
      anchorAlignTimeout.current = setTimeout(() => {
        pendingAnchor.current = undefined;
      }, ANCHOR_ALIGN_WINDOW_MS);
    },
    [scrollToAnchor],
  );

  /** Switches the rendered page; Body remounts and renders it from scratch. */
  const showPage = useCallback((index: number) => {
    if (index === pageIndexReference.current) return;
    pageIndexReference.current = index;
    // Progress against the old page's height means nothing for the new one.
    bodyRendered.current = false;
    setPageIndex(index);
  }, []);

  /**
   * Navigates to a page of a multi-page article, as the reader asked: to
   * the given anchor on it, or else to the start of the page. Remembers the
   * page as the reading position.
   * @param index The page index
   * @param targetAnchor Decoded id of an element on that page to align on
   */
  const goToPage = useCallback(
    (index: number, targetAnchor?: string) => {
      if (index < 0 || index >= pages.length) return;
      pageRestorePending.current = false;
      positionRestoreHandled.current = true;
      pendingAnchor.current = undefined;
      showPage(index);
      setPageAnchor(targetAnchor);
      if (targetAnchor) {
        alignToAnchor(targetAnchor);
        return;
      }
      const pageStart = pageStartReference.current;
      const innerView = innerViewReference.current;
      if (!pageStart || !innerView) return;
      pageStart.measureLayout(innerView, (_x, y) => {
        scrollReference.current?.scrollTo({ y, animated: false });
      });
    },
    [pages.length, showPage, alignToAnchor],
  );

  /** Aligns on an anchor, switching to the page containing it if needed. */
  const goToAnchor = useCallback(
    (id: string) => {
      const target = findPageIndexForAnchor(pages, id);
      if (target >= 0 && target !== pageIndexReference.current) {
        goToPage(target, id);
        return;
      }
      setPageAnchor(id);
      alignToAnchor(id);
    },
    [pages, goToPage, alignToAnchor],
  );

  const handleAnchorPress = useCallback(
    (id: string) => {
      positionRestoreHandled.current = true;
      // A tapped in-article anchor supersedes a deep-link anchor; otherwise
      // the next content resize would snap back to it.
      pendingAnchor.current = undefined;
      // A target further down may not be rendered yet (Body renders it
      // next), or live on another page; align on it once it is rendered.
      if (!scrollToAnchor(id)) goToAnchor(id);
    },
    [scrollToAnchor, goToAnchor],
  );

  // A link to one of the article's own paged URLs (`…/3/`).
  const handlePagePress = useCallback(
    (pageNumber: number, targetAnchor?: string) => {
      const index = findPageIndexForPageNumber(pages, pageNumber);
      // Page 1 is the plain permalink, even when an empty intro was dropped.
      if (index >= 0 || pageNumber === 1) {
        goToPage(Math.max(index, 0), targetAnchor);
      } else if (targetAnchor) {
        handleAnchorPress(targetAnchor);
      }
    },
    [pages, goToPage, handleAnchorPress],
  );

  const handleBodyRendered = useCallback(() => {
    bodyRendered.current = true;
  }, []);

  const handleLinkPress = useCallback(
    (_event: GestureResponderEvent, href: HttpsUrl) =>
      onLinkPress(href, router, article_link),
    [router, article_link],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(anchorAlignTimeout.current);
    };
  }, []);

  useEffect(() => {
    // A deep link to the already-open article updates the params on the
    // existing screen instance instead of remounting it — re-arm the pending
    // anchor and jump right away (no-op if the headers aren't laid out yet;
    // onContentSizeChange picks it up then).
    if (anchor) goToAnchor(anchor);
  }, [anchor, goToAnchor]);

  useEffect(() => {
    // Same for a paged deep link (`…/3/`) without a fragment.
    if (!page || anchor) return;
    const index = findPageIndexForPageNumber(pages, page);
    if (index >= 0 && index !== pageIndexReference.current) goToPage(index);
    // Only a changed page param is a new navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // Remember the page of a multi-page article as part of the reading
    // position; the saved position within it starts over.
    if (!isPaged || pageRestorePending.current) return;
    if (restoredPage.current === currentPage) {
      restoredPage.current = undefined;
      return;
    }
    savedPosition.current = 0;
    PersonalStore.setScrollPage(currentPage, slug);
    PersonalStore.setScrollPosition(0, slug);
  }, [isPaged, currentPage, slug]);

  useEffect(() => {
    // Resume a multi-page article on the page the reader left it on; the
    // position within that page is restored once it has rendered.
    if (!pageRestorePending.current) return;
    PersonalStore.getScrollPage(slug).then((savedPage) => {
      if (!mounted.current || !pageRestorePending.current) return;
      pageRestorePending.current = false;
      if (positionRestoreHandled.current) {
        // The reader started on this page instead; the position they save
        // from here on belongs to it.
        if (savedPage !== pageIndexReference.current) {
          PersonalStore.setScrollPage(pageIndexReference.current, slug);
        }
        return;
      }
      if (
        savedPage > 0 &&
        savedPage < pages.length &&
        savedPage !== pageIndexReference.current
      ) {
        restoredPage.current = savedPage;
        showPage(savedPage);
      } else if (bodyRendered.current) {
        restoreScrollPosition(contentHeight.current);
      }
    });
    // Once per article screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
   * Restores the reading position saved in storage, once per article and
   * only once the whole body is rendered — the saved position is a fraction
   * of the full content height. Skipped when the reader (or a deep-link
   * anchor) moved the view first.
   * @param height The scroll view's full content height
   */
  const restoreScrollPosition = (height: number) => {
    if (positionRestoreHandled.current || pageRestorePending.current) return;
    positionRestoreHandled.current = true;
    PersonalStore.getScrollPosition(slug).then((progress) => {
      if (!mounted.current || progress > 0.8) return;
      if (pendingAnchor.current) return;
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
    viewport.update(
      event.nativeEvent.contentOffset.y,
      event.nativeEvent.layoutMeasurement.height,
    );
    const progress =
      event.nativeEvent.contentOffset.y / event.nativeEvent.contentSize.height;
    scrollProgress.setValue(progress * 1.1 * width);
    // While the view is still auto-aligned on a deep-link anchor the scroll
    // events are programmatic, not reading: don't count a FullRead, don't
    // grant achievements, and don't clobber the saved reading position.
    // Likewise while the body is still rendering: progress against a partial
    // content height would overstate how far the reader got.
    if (pendingAnchor.current || !bodyRendered.current) return;
    if (isLastPage && progress > 0.7 && !fullRead.current) {
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
      <ReadingProgressBar
        progress={scrollProgress}
        height={4}
        color={progressColor}
        style={{ position: "absolute" }}
      />
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
          onContentSizeChange={(_width, height) => {
            contentHeight.current = height;
            // Re-align the pending anchor whenever async content (images,
            // embeds, further body chunks) resizes the article above it.
            if (pendingAnchor.current) {
              scrollToAnchor(pendingAnchor.current);
            } else if (bodyRendered.current) {
              restoreScrollPosition(height);
            }
          }}
          onScrollBeginDrag={() => {
            // The user took over — stop snapping back to the anchor, and
            // don't yank them to the saved position anymore.
            pendingAnchor.current = undefined;
            positionRestoreHandled.current = true;
          }}
        >
          <View style={{ paddingBottom: 100 }}>
            <Header
              article={article}
              article_image={article_image}
              article_link={article_link}
              article_title={article_title}
              date={date}
              slug={slug}
            />
            <View ref={pageStartReference} collapsable={false}>
              {isPaged && (
                <ArticleTableOfContents
                  pages={pages}
                  currentPage={currentPage}
                  onSelectPage={goToPage}
                />
              )}
            </View>
            <ScrollViewportContext.Provider value={viewport}>
              <Body
                key={currentPage}
                article_content={pages[currentPage].html}
                article_title={article_title}
                slug={slug}
                article_link={article_link}
                maxWidth={maxWidth}
                width={width}
                headerRefs={headerReferences}
                onAnchorPress={handleAnchorPress}
                onLinkPress={handleLinkPress}
                anchor={pageAnchor}
                onRendered={handleBodyRendered}
                onPagePress={handlePagePress}
              />
            </ScrollViewportContext.Provider>
            {isPaged && (
              <ArticlePageNavigation
                pages={pages}
                currentPage={currentPage}
                onSelectPage={goToPage}
              />
            )}
            {isLastPage && (
              <>
                <Recommended article_link={article_link}></Recommended>
                <Footer
                  article_link={article_link}
                  article_title={article_title}
                  onShare={onShare}
                />
              </>
            )}
          </View>
        </ScrollView>
        <BackToTopButton
          visible={backToTop.visible}
          onPress={() => {
            // Back-to-top is explicit user navigation — it must win over a
            // still-pending deep-link anchor.
            pendingAnchor.current = undefined;
            positionRestoreHandled.current = true;
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
