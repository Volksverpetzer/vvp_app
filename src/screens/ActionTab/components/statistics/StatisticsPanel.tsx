import { StyleSheet, View } from "react-native";

import type { OcticonsIconName } from "#/components/Icons";
import { ChevronIcon, StatisticsIcon } from "#/components/Icons";
import UiPressable from "#/components/ui/UiPressable";
import UiText from "#/components/ui/UiText";
import { globalStyles } from "#/constants/GlobalStyles";
import { iconSizes } from "#/constants/IconSizes";
import { spacing } from "#/constants/Spacing";
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
  contentColor: string;
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
  contentColor,
}: StatsPanelProperties) => {
  return (
    <View
      style={[
        globalStyles.centered,
        { width, gap: spacing.md, paddingBottom: spacing.md },
      ]}
    >
      <View
        style={[
          globalStyles.row,
          {
            justifyContent: "flex-start",
            paddingLeft: spacing.xxxl,
            gap: spacing.md,
          },
        ]}
      >
        <StatisticsIcon name={icon} size={iconSizes.lg} color={contentColor} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: spacing.md,
          }}
        >
          <UiText size="xl" bold style={{ color: contentColor }}>
            {title}
          </UiText>
          {subtitle && (
            <UiText size="xs" style={{ color: contentColor }}>
              {subtitle}
            </UiText>
          )}
        </View>
      </View>

      <View style={panelStyles.contentRow}>
        {showLeftChevron && onLeftPress ? (
          <UiPressable
            accessibilityRole="button"
            accessibilityLabel="Vorherige Seite"
            accessibilityHint="Zeigt die vorherigen Statistiken an"
            onPress={onLeftPress}
            style={panelStyles.chevronButton}
          >
            <ChevronIcon
              direction="left"
              size={iconSizes.md}
              color={contentColor}
            />
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
            accessibilityHint="Zeigt die nächsten Statistiken an"
            onPress={onRightPress}
            style={panelStyles.chevronButton}
          >
            <ChevronIcon
              direction="right"
              size={iconSizes.md}
              color={contentColor}
            />
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
    paddingVertical: spacing.md,
  },
  chevronSlot: {
    width: 32,
  },
  statisticsRow: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
  },
  statisticsBox: {
    flex: 1,
    minWidth: 0,
  },
});

export default StatisticsPanel;
