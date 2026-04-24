import { Pressable, View } from "react-native";

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
  onLeftPress?: () => void;
  onRightPress?: () => void;
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
  onLeftPress,
  onRightPress,
  width,
  statistics,
  descriptionMap,
}: StatsPanelProperties) => {
  const colorScheme = useAppColorScheme();
  const muted = Colors[colorScheme].muted;

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
              color: muted,
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
          <Pressable
            onPress={onLeftPress}
            style={{ paddingHorizontal: 8, paddingVertical: 12 }}
          >
            <ChevronIcon direction="left" size={24} color="white" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
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
          <Pressable
            onPress={onRightPress}
            style={{ paddingHorizontal: 8, paddingVertical: 12 }}
          >
            <ChevronIcon direction="right" size={24} color="white" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <Space size={10} />
    </View>
  );
};

export default StatisticsPanel;
