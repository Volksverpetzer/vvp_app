import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Animated, ScrollView, View, useWindowDimensions } from "react-native";

import NavBar from "#/components/bars/NavBar";
import Footer from "#/components/views/Footer";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { Achievements } from "#/helpers/Achievements";
import { onLinkPress } from "#/helpers/Linking";
import { onShare } from "#/helpers/Sharing";
import Statistics from "#/helpers/Statistics";
import PersonalStore from "#/helpers/Stores/PersonalStore";
import { registerEvent, registerViews } from "#/helpers/network/Analytics";
import { stripVisualComposerShortcodes } from "#/helpers/utils/posts";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
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
  const corporate = Colors[colorScheme].corporate;
  const backgroundColor = Colors[colorScheme].background;

  let fullRead = false;
  let savedPosition = 0;
  let heightCaptured = false;
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
    registerViews(article_link);
    Statistics.countArticleRead();
  }, [article_link]);

  /**
   * Called once when the article layout is rendered.
   * Captures the content height and restores the scroll position saved in storage.
   * Prevents re-running after the first layout via heightCaptured flag.
   * @param event LayoutChangeEvent containing nativeEvent.layout.height
   */
  const onRender = (event: LayoutChangeEvent) => {
    if (heightCaptured) return;
    heightCaptured = true;
    const height = event.nativeEvent.layout.height;
    PersonalStore.getScrollPosition(slug).then((progress) => {
      if (progress > 0.8) return;
      savedPosition = progress;
      scrollReference.current.scrollTo({
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
    const progress =
      event.nativeEvent.contentOffset.y / event.nativeEvent.contentSize.height;
    scrollProgress.setValue(progress * 1.1 * width);
    if (progress > 0.7 && !fullRead) {
      fullRead = true;
      registerEvent(article_link, "FullRead");
      Achievements.setAchievementValue("reader", true);
    }
    if (Math.abs(progress - savedPosition) > 0.02) {
      savedPosition = progress;
      PersonalStore.setScrollPosition(progress, slug);
    }
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
    {
      useNativeDriver: false,
      listener: scrollListener,
    },
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          position: "absolute",
          zIndex: 30,
          height: 5,
          width: scrollProgress,
          backgroundColor: corporate,
        }}
      ></Animated.View>
      <ScrollView
        style={{
          backgroundColor,
        }}
        onScroll={onScroll}
        ref={scrollReference}
        scrollEventThrottle={16}
      >
        <View
          onLayout={onRender}
          style={{
            maxWidth: 700,
            margin: width > 700 ? "auto" : undefined,
          }}
        >
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
