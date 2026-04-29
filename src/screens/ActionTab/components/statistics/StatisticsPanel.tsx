import { Pressable, StyleSheet, View } from "react-native";

import type { OcticonsIconName } from "#/components/Icons";
import { ChevronIcon, StatisticsIcon } from "#/components/Icons";
import Space from "#/components/design/Space";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";
import type { StatisticsType, StatisticsValueKey } from "#/types";

import StatisticsBox from "./StatisticsBox";

type LeftChevronProp =
  | { showLeftChevron: true; onLeftPress: () => void }
  | { showLeftChevron?: false; onLeftPress?: never };

type RightChevronProp =
  | { showRightChevron: true; onRightPress: () => void }
  | { showRightChevron?: false; onRightPress?: never };

type StatsPanelProperties = {
  icon: OcticonsIconName;
  title: string;
  subtitle?: string;
  streakKeyToExclude: string;
  valueKey: StatisticsValueKey;
  width: number;
  statistics: Record<string, StatisticsType>;
  descriptionMap: Record<string, string>;
} & LeftChevronProp &
  RightChevronProp;

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
            fontFamily: "SourceSansProBold",
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

      <View style={panelStyles.contentRow}>
        {showLeftChevron && onLeftPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vorherige Seite"
            onPress={onLeftPress}
            style={panelStyles.chevronButton}
          >
            <ChevronIcon direction="left" size={24} color="white" />
          </Pressable>
        ) : (
          <View style={panelStyles.chevronSlot} />
        )}

        <View style={panelStyles.statisticsRow}>
          {Object.entries(statistics)
            .filter(([key]) => key !== streakKeyToExclude)
            .map(([key, s]) => (
              <StatisticsBox
                key={key}
                statisticsKey={key}
                statistic={s}
                valueKey={valueKey}
                descriptionMap={descriptionMap}
                style={panelStyles.statisticsBox}
              />
            ))}
        </View>

        {showRightChevron && onRightPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nächste Seite"
            onPress={onRightPress}
            style={panelStyles.chevronButton}
          >
            <ChevronIcon direction="right" size={24} color="white" />
          </Pressable>
        ) : (
          <View style={panelStyles.chevronSlot} />
        )}
      </View>

      <Space size={10} />
    </View>
  );
};

const panelStyles = StyleSheet.create({
  contentRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  chevronButton: {
    width: 40,
    alignItems: "center",
    paddingVertical: 12,
  },
  chevronSlot: {
    width: 32,
  },
  statisticsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  statisticsBox: {
    flex: 1,
    minWidth: 0,
  },
});

export default StatisticsPanel;
