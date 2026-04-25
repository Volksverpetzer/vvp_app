import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ScrollView, View } from "react-native";

import AnimatedPageDots from "#/components/animations/AnimatedPageDots";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
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
  const [scrollX] = useState(new Animated.Value(0));
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);
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

  return (
    <View
      style={{
        ...styles.centered,
        zIndex: 99,
        backgroundColor: corporate,
        borderRadius: 30,
        paddingVertical: 20,
        marginHorizontal: 10,
      }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: panelWidth }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      >
        <StatisticsPanel
          icon="zap"
          title="Meine Streaks"
          subtitle="Einmal pro Woche."
          streakKeyToExclude="sourcesChecked"
          valueKey="streak"
          showLeftChevron={false}
          showRightChevron={true}
          onRightPress={() =>
            scrollViewRef.current?.scrollTo({ x: panelWidth, animated: true })
          }
          width={panelWidth}
          statistics={statistics}
          descriptionMap={descriptionMap}
        />

        <StatisticsPanel
          icon="person"
          title="Meine Stats"
          subtitle={undefined}
          streakKeyToExclude="appOpened"
          valueKey="count"
          showLeftChevron={true}
          showRightChevron={false}
          onLeftPress={() =>
            scrollViewRef.current?.scrollTo({ x: 0, animated: true })
          }
          width={panelWidth}
          statistics={statistics}
          descriptionMap={descriptionMap}
        />
      </ScrollView>

      <View style={{ height: 20, zIndex: 99 }}>
        <AnimatedPageDots
          scrollX={scrollX}
          width={200}
          length={2}
          color="white"
        />
      </View>
    </View>
  );
};

export default StatisticsView;
