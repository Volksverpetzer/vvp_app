import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Animated, ScrollView, View } from "react-native";

import AnimatedPageDots from "#/components/animations/AnimatedPageDots";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import Statistics from "#/helpers/Statistics";
import { useFeedDimensions } from "#/hooks/useFeedDimensions";
import { StatisticsType } from "#/types";

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
  const { width } = useFeedDimensions();
  const { corporate, grayedOutText: grayed } = Colors.dark;
  const corporateColor = Colors.light.corporate;

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
        ...styles.feed,
        zIndex: 99,
        backgroundColor: corporate,
        borderRadius: 30,
        paddingVertical: 20,
      }}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      >
        <StatisticsPanel
          icon="fire"
          title="Meine Streaks"
          subtitle="Einmal pro Woche."
          streakKeyToExclude="sourcesChecked"
          valueKey="streak"
          showLeftChevron={false}
          showRightChevron={true}
          width={width}
          statistics={statistics}
          descriptionMap={descriptionMap}
          corporateColor={corporateColor}
          grayed={grayed}
        />

        <StatisticsPanel
          icon="account"
          title="Meine Stats"
          subtitle={undefined}
          streakKeyToExclude="appOpened"
          valueKey="count"
          showLeftChevron={true}
          showRightChevron={false}
          width={width}
          statistics={statistics}
          descriptionMap={descriptionMap}
          corporateColor={corporateColor}
          grayed={grayed}
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
