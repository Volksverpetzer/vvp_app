import { Text, View } from "react-native";

import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import type { StatisticsType, StatisticsValueKey } from "#/types";

interface StatsBoxProperties {
  statisticsKey: string;
  statistic: StatisticsType;
  valueKey: StatisticsValueKey;
  descriptionMap: Record<string, string>;
}

const StatisticsBox = ({
  statisticsKey,
  statistic,
  valueKey,
  descriptionMap,
}: StatsBoxProperties) => {
  const corporateTint = Colors.dark.corporateTint;

  return (
    <View
      key={statisticsKey}
      style={{
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: corporateTint,
        padding: 10,
        borderRadius: 10,
      }}
    >
      <Text style={{ ...styles.whiteText, fontSize: 20 }}>
        {statistic[valueKey]}
      </Text>
      <Text style={{ ...styles.whiteText, fontSize: 12 }}>
        {descriptionMap[statisticsKey]}
      </Text>
    </View>
  );
};

export default StatisticsBox;
