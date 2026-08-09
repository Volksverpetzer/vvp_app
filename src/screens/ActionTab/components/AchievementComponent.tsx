import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { CheckboxIcon, CircleIcon } from "#/components/Icons";
import UiText from "#/components/ui/UiText";
import { radii } from "#/constants/BorderRadius";
import Colors from "#/constants/Colors";
import { fontSizes } from "#/constants/FontSizes";
import { globalStyles } from "#/constants/GlobalStyles";
import { spacing } from "#/constants/Spacing";
import type { LevelType, TaskType } from "#/helpers/Achievements";
import { AchievementConfig, Achievements } from "#/helpers/Achievements";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Parallelogram from "./Parallelogram";

const AchievementComponent = () => {
  const [level, setLevel] = useState<number>(0);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const corporate = Colors.dark.primary;
  const corporateColor = Colors.light.primary;
  const colorScheme = useAppColorScheme();
  const highlight = Colors[colorScheme].accent;
  const backgroundColor = Colors[colorScheme].background;

  const updateLevelData = () => {
    Achievements.getCurrentAchievements().then((data: LevelType) => {
      setLevel(data.level);
      setTasks(Object.values(data.tasks));
    });
  };

  useEffect(() => {
    updateLevelData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      updateLevelData();
      updateBadgeState({ action: false });
    }, []),
  );

  return (
    <View
      style={{
        backgroundColor: corporate,
        marginHorizontal: spacing.xl,
        marginTop: spacing.xxxl,
        borderRadius: radii.md,
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View style={[globalStyles.row, { justifyContent: "flex-start" }]}>
        <View
          style={{
            marginTop: -60,
            marginLeft: -25,
            marginRight: spacing.md,
            width: 60,
            height: 60,
            borderRadius: 40,
            backgroundColor,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
          }}
        >
          <UiText style={{ fontSize: 30 }}>
            {AchievementConfig[level].logo}
          </UiText>
        </View>
        <View style={{ alignItems: "flex-start", marginLeft: -20 }}>
          <Parallelogram
            backgroundColor={highlight}
            color="white"
            textStyle={{
              fontSize: fontSizes.xxl,
              fontFamily: "SourceSansProBoldItalic",
            }}
            containerStyle={{ height: 45, marginTop: -30 }}
          >
            Mission
          </Parallelogram>
          <Parallelogram
            backgroundColor={corporateColor}
            color="white"
            containerStyle={{ height: 30, marginTop: 0, marginLeft: -20 }}
          >
            Level {level + 1 + ": " + AchievementConfig[level].name}
          </Parallelogram>
        </View>
      </View>
      <View style={{ gap: spacing.xs }}>
        {tasks &&
          tasks.map((task, key) => {
            return (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {!!task.value ? (
                  <CheckboxIcon size={16} color="white" />
                ) : (
                  <CircleIcon size={16} color="white" />
                )}
                <UiText
                  size="base"
                  style={[
                    globalStyles.whiteText,
                    { padding: spacing.xs, paddingLeft: spacing.xl },
                  ]}
                >
                  {task.verbose}
                </UiText>
              </View>
            );
          })}
      </View>
    </View>
  );
};

export default AchievementComponent;
