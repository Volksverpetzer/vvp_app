import { ScrollView } from "react-native-gesture-handler";

import Colors from "../../constants/Colors";
import useColorScheme from "../../hooks/useColorScheme";
import AchievementComponent from "../../screens/ActionTab/components/AchievementComponent";
import RegionMap from "../../screens/ActionTab/components/RegionMap";
import StatisticsView from "../../screens/ActionTab/components/statistics/StatisticsView";

const ActionTab = () => {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme].secondaryBackground;
  return (
    <ScrollView style={{ flex: 1, backgroundColor }}>
      <AchievementComponent />
      <StatisticsView />
      <RegionMap />
    </ScrollView>
  );
};

export default ActionTab;
