import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text } from "react-native";

import { LogoBig, SearchIcon } from "#/components/Icons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import View from "#/components/design/View";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { styles } from "#/constants/Styles";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import { getEnabledFeeds } from "#/helpers/utils/feeds";
import { isVolksverpetzer } from "#/helpers/utils/variant";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { FeedProperties } from "#/screens/Home/components/Feed";
import Feed from "#/screens/Home/components/Feed";
import Fetcher from "#/screens/Home/fetchers/FeedFetcher";

/**
 * HomeScreen is the main feed view. It fetches multiple social feeds
 * and displays content with an animated header and search shortcut.
 *
 * Note: Share intent routing is handled by the dedicated /shareintent screen
 * (src/app/shareintent.tsx), which is routed via +native-intent.tsx.
 *
 * @returns React element for the home feed screen.
 */
const HomeScreen = () => {
  const { contentSettings } = useContext(SettingsContext);
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].text;

  const HEADER_HEIGHT = 220;

  const [feedprops, setFeedProperties] = useState<FeedProperties>({
    fetchers: [],
  });

  useEffect(() => {
    const enabled = getEnabledFeeds(
      Config.feeds,
    ) as (keyof typeof contentSettings)[];
    setFeedProperties({
      fetchers: enabled
        .filter((feed) => contentSettings[feed].value)
        .map((feed) => ({
          fetcher: Fetcher[feed],
        })),
    });
  }, [contentSettings]);

  return (
    <View style={styles.container}>
      <AnimatedHeader
        title={!isVolksverpetzer ? Constants.expoConfig.name : ""}
        headerComponent={
          isVolksverpetzer && (
            <LogoBig color={color} style={{ marginLeft: 20 }} />
          )
        }
        scrollOffsetY={scrollOffsetY}
        minHeight={0}
        maxHeight={HEADER_HEIGHT}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/search")}
        >
          <View
            style={{
              ...styles.row,
              padding: 0,
              width: "100%",
              height: "100%",
              ...styles.noBackground,
            }}
          >
            <Text
              style={{
                ...styles.whiteText,
                fontFamily: "SourceSansPro",
                fontSize: 16,
              }}
            >
              Suche ...
            </Text>
            <SearchIcon color={"white"} />
          </View>
        </Pressable>
      </AnimatedHeader>
      <Feed
        {...feedprops}
        key={0}
        style={{ paddingTop: HEADER_HEIGHT }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          {
            useNativeDriver: false,
          },
        )}
      />
    </View>
  );
};

export default HomeScreen;
