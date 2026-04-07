import { View } from "react-native";

import type { OcticonsIconName } from "#/components/Icons";
import { ChevronIcon, StatisticsIcon } from "#/components/Icons";
import Space from "#/components/design/Space";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { StatisticsType, StatisticsValueKey } from "#/types";

import StatisticsBox from "./StatisticsBox";

interface StatsPanelProperties {
  icon: OcticonsIconName;
  title: string;
  subtitle?: string;
  streakKeyToExclude: string;
  valueKey: StatisticsValueKey;
  showLeftChevron?: boolean;
  showRightChevron?: boolean;
  width: number;
  statistics: Record<string, StatisticsType>;
  descriptionMap: Record<string, string>;
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
}: StatsPanelProperties) => {
  const colorScheme = useAppColorScheme();
  const grayedOut = Colors[colorScheme].grayedOut;

  return (
    <View style={{ ...styles.centered, width }}>
      <View
        style={{ ...styles.row, justifyContent: "flex-start", paddingLeft: 30 }}
      >
        <StatisticsIcon name={icon} size={32} color="white" />
        <UiText
          style={{
            ...styles.whiteText,
            fontSize: 20,
            fontWeight: "bold",
            marginLeft: 10,
          }}
        >
          {title}
        </UiText>
        {subtitle && (
          <UiText
            style={{
              fontSize: 12,
              color: grayedOut,
              paddingLeft: 10,
              paddingBottom: 3,
              alignSelf: "flex-end",
            }}
          >
            {subtitle}
          </UiText>
        )}
      </View>

      <Space size={10} />

      <View style={styles.row}>
        {showLeftChevron ? (
          <View style={{ width: 24 }}>
            <ChevronIcon direction="left" size={24} color="white" />
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
