import { Text, View } from "react-native";

import {
  ChevronIcon,
  MaterialCommunityIconName,
  StatisticsIcon,
} from "#/components/Icons";
import Space from "#/components/design/Space";
import { styles } from "#/constants/Styles";
import { StatisticsType, StatisticsValueKey } from "#/types";

import StatisticsBox from "./StatisticsBox";

interface StatsPanelProperties {
  icon: MaterialCommunityIconName;
  title: string;
  subtitle?: string;
  streakKeyToExclude: string;
  valueKey: StatisticsValueKey;
  showLeftChevron?: boolean;
  showRightChevron?: boolean;
  width: number;
  statistics: Record<string, StatisticsType>;
  descriptionMap: Record<string, string>;
  corporateColor: string;
  grayed: string;
}

const StatisticsPanel = ({
  icon,
  title,
  subtitle,
  streakKeyToExclude,
  valueKey,
  showLeftChevron = false,
  showRightChevron = false,
  width,
  statistics,
  descriptionMap,
  corporateColor,
  grayed,
}: StatsPanelProperties) => {
  return (
    <View style={{ ...styles.centered, width }}>
      <View
        style={{ ...styles.row, justifyContent: "flex-start", paddingLeft: 30 }}
      >
        <StatisticsIcon name={icon} size={40} color="white" />
        <Text
          style={{
            ...styles.whiteText,
            fontSize: 20,
            fontWeight: "bold",
            marginLeft: 10,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: grayed, paddingLeft: 10 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <Space size={10} />

      <View style={styles.row}>
        {showLeftChevron ? (
          <View style={{ width: 24 }}>
            <ChevronIcon direction="left" size={24} color={"white"} />
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}

        {Object.entries(statistics)
          .filter(([key]) => key !== streakKeyToExclude)
          .map(([key, s]) => (
            <StatisticsBox
              key={key}
              statisticsKey={key}
              statistic={s}
              valueKey={valueKey}
              descriptionMap={descriptionMap}
              corporateColor={corporateColor}
            />
          ))}

        {showRightChevron ? (
          <View style={{ width: 24 }}>
            <ChevronIcon direction="right" size={24} color="white" />
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <Space size={10} />
    </View>
  );
};

export default StatisticsPanel;
