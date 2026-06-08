import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import AnimatedPageDots from "#/components/animations/AnimatedPageDots";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import Statistics from "#/helpers/Statistics";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import type { StatisticsType } from "#/types";

import StatisticsPanel from "./StatisticsPanel";

const descriptionMap: Record<string, string> = {
  articlesRead: "Artikel gelesen",
  articlesShared: "Artikel geteilt",
  sourcesChecked: "Quellen-Klicks",
  appOpened: "App geöffnet",
};

const StatisticsView = () => {
  const [statistics, setStatistics] = useState<Record<string, StatisticsType>>(
    {},
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const progressValue = useSharedValue(0);
  const { width } = useFeedDimensions();
  const panelWidth = containerWidth || width;
  const corporate = Colors.dark.primary;

  useEffect(() => {
    Statistics.getAllStatistics().then(setStatistics);
  }, []);

  useFocusEffect(
    useCallback(() => {
      Statistics.getAllStatistics().then(setStatistics);
    }, []),
  );

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        progressValue.value = event.contentOffset.x / Math.max(panelWidth, 1);
      },
    },
    [panelWidth],
  );

  const scrollToPanel = useCallback(
    (x: number) => {
      runOnUI(scrollTo)(scrollViewRef, x, 0, true);
    },
    [scrollViewRef],
  );

  return (
    <View
      style={[
        globalStyles.centered,
        {
          zIndex: 99,
          backgroundColor: corporate,
          borderRadius: 30,
          paddingVertical: 20,
          marginHorizontal: 10,
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: panelWidth }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <StatisticsPanel
          icon="zap"
          title="Meine Streaks"
          subtitle="Einmal pro Woche."
          streakKeyToExclude="sourcesChecked"
          valueKey="streak"
          showLeftChevron={false}
          showRightChevron={true}
          onRightPress={() => scrollToPanel(panelWidth)}
          width={panelWidth}
          statistics={statistics}
          descriptionMap={descriptionMap}
        />
        <StatisticsPanel
          icon="person"
          title="Meine Stats"
          streakKeyToExclude="appOpened"
          valueKey="count"
          showLeftChevron={true}
          showRightChevron={false}
          onLeftPress={() => scrollToPanel(0)}
          width={panelWidth}
          statistics={statistics}
          descriptionMap={descriptionMap}
        />
      </Animated.ScrollView>

      <View style={{ height: 20, zIndex: 99 }}>
        <AnimatedPageDots progress={progressValue} length={2} color="white" />
      </View>
    </View>
  );
};

export default StatisticsView;
