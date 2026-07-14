import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import type {
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

interface ArticleScreenProperties {
  article: ArticleProperties;
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
  const { article } = properties;
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const scrollProgress = useRef(new Animated.Value(0)).current;
  const scrollReference = useRef<ScrollView>(null);
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const backToTop = useBackToTop();
  const corporate = Colors[colorScheme].primary;
  const backgroundColor = Colors[colorScheme].background;

  const fullRead = useRef(false);
  const savedPosition = useRef(0);
  const heightCaptured = useRef(false);
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

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
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
   * Called once when the article layout is rendered.
   * Captures the content height and restores the scroll position saved in storage.
   * Prevents re-running after the first layout via heightCaptured flag.
   * @param event LayoutChangeEvent containing nativeEvent.layout.height
   */
  const onRender = (event: LayoutChangeEvent) => {
    if (heightCaptured.current) return;
    heightCaptured.current = true;
    const height = event.nativeEvent.layout.height;
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
          style={{
            backgroundColor,
          }}
          contentContainerStyle={[globalStyles.content]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            { useNativeDriver: false, listener: scrollListener },
          )}
          ref={scrollReference}
          scrollEventThrottle={16}
        >
          <View onLayout={onRender}>
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
              scrollRef={scrollReference}
              onLinkPress={(event, href: HttpsUrl) =>
                onLinkPress(href, router, article_link)
              }
            />
            <Recommended article_link={article_link}></Recommended>
            <Footer article_link={article_link} onShare={onShare} />
          </View>
        </ScrollView>
        <BackToTopButton
          visible={backToTop.visible}
          onPress={() =>
            scrollReference.current?.scrollTo({ y: 0, animated: true })
          }
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
