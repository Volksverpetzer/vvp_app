import { Text, View } from "react-native";

import { styles } from "#/constants/Styles";
import { StatisticsType, StatisticsValueKey } from "#/types";

interface StatsBoxProperties {
  statisticsKey: string;
  statistic: StatisticsType;
  valueKey: StatisticsValueKey;
  descriptionMap: Record<string, string>;
  corporateColor: string;
}

const StatisticsBox = ({
  statisticsKey,
  statistic,
  valueKey,
  descriptionMap,
  corporateColor,
}: StatsBoxProperties) => {
  return (
    <View
      key={statisticsKey}
      style={{
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: corporateColor,
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
