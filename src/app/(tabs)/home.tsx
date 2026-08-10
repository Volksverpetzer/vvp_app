import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

import { SearchIcon } from "#/components/Icons";
import { LogoBig } from "#/components/SvgIcons";
import AnimatedHeader from "#/components/animations/AnimatedHeader";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import Config from "#/constants/Config";
import { INPUT_FONT_SIZE, globalStyles } from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
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
 * Note: Share intent routing is handled by the dedicated /handle-share screen
 * (src/app/handle-share.tsx), which is routed via +native-intent.tsx.
 *
 * @returns React element for the home feed screen.
 */
const HomeScreen = () => {
  const { contentSettings } = useContext(SettingsContext);
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const color = Colors[colorScheme].text;
  const corporate = Colors[colorScheme].primary;
  const backgroundColor = Colors[colorScheme].surface;

  const HEADER_HEIGHT = 220;

  const [feedprops, setFeedProperties] = useState<FeedProperties>({
    fetchers: [],
  });

  useEffect(() => {
    const enabled = getEnabledFeeds(Config.feeds);
    setFeedProperties({
      fetchers: enabled
        .filter((feed) => contentSettings[feed]?.value)
        .map((feed) => ({
          fetcher: Fetcher[feed],
        })),
    });
  }, [contentSettings]);

  return (
    <>
      <AnimatedHeader
        title={
          isVolksverpetzer ? (
            <LogoBig color={color} style={{ marginLeft: spacing.xl }} />
          ) : (
            Constants.expoConfig.name
          )
        }
        scrollOffsetY={scrollOffsetY}
        minHeight={95}
        maxHeight={HEADER_HEIGHT}
      >
        <UiPressable
          accessibilityRole="button"
          onPress={() => router.push("/search")}
          style={[
            globalStyles.row,
            globalStyles.input,
            { height: 50, backgroundColor: corporate },
          ]}
        >
          <UiText
            style={[
              globalStyles.whiteText,
              { fontFamily: "SourceSansPro", fontSize: INPUT_FONT_SIZE },
            ]}
          >
            Suche ...
          </UiText>
          <SearchIcon color="white" size={iconSizes.md} />
        </UiPressable>
      </AnimatedHeader>
      <View style={[globalStyles.container, { backgroundColor }]}>
        <Feed
          {...feedprops}
          key={0}
          showAnnouncements
          style={{ paddingTop: HEADER_HEIGHT, gap: spacing.xl }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
            {
              useNativeDriver: false,
            },
          )}
        />
      </View>
    </>
  );
};

export default HomeScreen;
