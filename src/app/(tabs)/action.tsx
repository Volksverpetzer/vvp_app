import { Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import AchievementComponent from "#/screens/ActionTab/components/AchievementComponent";
import RegionMap from "#/screens/ActionTab/components/RegionMap";
import StatisticsView from "#/screens/ActionTab/components/statistics/StatisticsView";

const ActionTab = () => {
  const colorScheme = useAppColorScheme();
  const backgroundColor = Colors[colorScheme].surface;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={[
        globalStyles.content,
        {
          paddingHorizontal: 0,
          gap: spacing.xl,
          // On native, this screen sits below the device's status-bar safe
          // area, which already clears AchievementComponent's badge (it
          // pokes 60px above its own card). Web has no such inset, so the
          // badge gets clipped by the scroll container's top edge without
          // this.
          ...(Platform.OS === "web" && { paddingTop: spacing.huge }),
        },
      ]}
    >
      <AchievementComponent />
      <StatisticsView />
      <RegionMap />
    </ScrollView>
  );
};

export default ActionTab;
