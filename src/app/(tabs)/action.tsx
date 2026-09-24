import { useRouter } from "expo-router";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import UiButton from "#/components/ui/UiButton";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import { useTabBarClearance } from "#/hooks/useTabBarClearance";
import AchievementComponent from "#/screens/ActionTab/components/AchievementComponent";
import RegionMap from "#/screens/ActionTab/components/RegionMap";
import StatisticsView from "#/screens/ActionTab/components/statistics/StatisticsView";

const ActionTab = () => {
  const colorScheme = useAppColorScheme();
  const tabBarClearance = useTabBarClearance();
  const backgroundColor = Colors[colorScheme].surface;
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={[
        globalStyles.content,
        {
          paddingHorizontal: 0,
          gap: spacing.xl,
          paddingBottom: tabBarClearance,
        },
      ]}
    >
      <AchievementComponent />
      <StatisticsView />
      <RegionMap />
      <View style={{ paddingHorizontal: spacing.xl }}>
        <UiButton
          label="Desinformations-Memory spielen"
          onPress={() => router.push("/game")}
        />
      </View>
    </ScrollView>
  );
};

export default ActionTab;
