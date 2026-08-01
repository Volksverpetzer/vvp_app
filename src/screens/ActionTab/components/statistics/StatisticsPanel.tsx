import { StyleSheet, View } from "react-native";

import type { OcticonsIconName } from "#/components/Icons";
import { ChevronIcon, StatisticsIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import Colors from "#/constants/Colors";
import { globalStyles } from "#/constants/GlobalStyles";
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
  const textMuted = Colors[colorScheme].textMuted;

  return (
    <View
      style={[globalStyles.centered, { width, gap: 10, paddingBottom: 10 }]}
    >
      <View
        style={[
          globalStyles.row,
          { justifyContent: "flex-start", paddingLeft: 30 },
        ]}
      >
        <StatisticsIcon name={icon} size={32} color="white" />
        <UiText
          size="xl"
          bold
          style={[globalStyles.whiteText, { marginLeft: 10 }]}
        >
          {title}
        </UiText>
        {subtitle && (
          <UiText
            size="xs"
            style={{
              color: textMuted,
              paddingLeft: 10,
              paddingBottom: 3,
              alignSelf: "flex-end",
            }}
          >
            {subtitle}
          </UiText>
        )}
      </View>

      <View style={panelStyles.contentRow}>
        {showLeftChevron && onLeftPress ? (
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Vorherige Seite"
            onPress={onLeftPress}
            style={panelStyles.chevronButton}
          >
            <ChevronIcon direction="left" size={24} color="white" />
          </UiPressable>
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
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Nächste Seite"
            onPress={onRightPress}
            style={panelStyles.chevronButton}
          >
            <ChevronIcon direction="right" size={24} color="white" />
          </UiPressable>
        ) : (
          <View style={panelStyles.chevronSlot} />
        )}
      </View>
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
