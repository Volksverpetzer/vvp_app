import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import type { StatisticsType, StatisticsValueKey } from "#/types";

interface StatsBoxProperties {
  statisticsKey: string;
  statistic: StatisticsType;
  valueKey: StatisticsValueKey;
  descriptionMap: Record<string, string>;
  style?: StyleProp<ViewStyle>;
}

const StatisticsBox = ({
  statisticsKey,
  statistic,
  valueKey,
  descriptionMap,
  style,
}: StatsBoxProperties) => {
  const primaryTint = Colors.dark.primaryTint;

  return (
    <View
      style={[boxStyles.container, { backgroundColor: primaryTint }, style]}
    >
      <UiText style={boxStyles.valueText} numberOfLines={1}>
        {statistic[valueKey]}
      </UiText>
      <UiText style={boxStyles.labelText} numberOfLines={2}>
        {descriptionMap[statisticsKey]}
      </UiText>
    </View>
  );
};

const boxStyles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  valueText: {
    ...styles.whiteText,
    width: "100%",
    fontSize: 20,
    textAlign: "center",
  },
  labelText: {
    ...styles.whiteText,
    width: "100%",
    fontSize: 12,
    textAlign: "center",
  },
});

export default StatisticsBox;
