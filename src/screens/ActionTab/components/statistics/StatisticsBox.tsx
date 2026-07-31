import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
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
  const primaryMuted = Colors.dark.primaryMuted;

  return (
    <View
      style={[boxStyles.container, { backgroundColor: primaryMuted }, style]}
    >
      <UiText size="xl" style={boxStyles.valueText} numberOfLines={1}>
        {statistic[valueKey]}
      </UiText>
      <UiText size="xs" style={boxStyles.labelText} numberOfLines={2}>
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
    borderRadius: radii.md,
  },
  valueText: {
    color: "white",
    width: "100%",
    textAlign: "center",
  },
  labelText: {
    color: "white",
    width: "100%",
    textAlign: "center",
  },
});

export default StatisticsBox;
