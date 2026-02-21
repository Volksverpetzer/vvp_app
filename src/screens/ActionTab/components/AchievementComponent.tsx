import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { CheckboxIcon, CircleIcon } from "#/components/Icons";
import Space from "#/components/design/Space";
import Colors from "#/constants/Colors";
import { styles } from "#/constants/Styles";
import {
  AchievementConfig,
  Achievements,
  LevelType,
  TaskType,
} from "#/helpers/Achievements";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { useAppColorScheme } from "#/hooks/useAppColorScheme";

import Parallelogram from "./Parallelogram";

const AchievementComponent = () => {
  const [level, setLevel] = useState<number>(0);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const corporate = Colors["dark"].corporate;
  const corporateColor = Colors["light"].corporate;
  const colorScheme = useAppColorScheme();
  const highlight = Colors[colorScheme].highlight;
  const backgroundColor = Colors[colorScheme].background;
  const secondaryBackground = Colors[colorScheme].secondaryBackground;

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
        margin: 20,
        borderRadius: 10,
        padding: 20,
        marginTop: 40,
      }}
    >
      <View style={{ ...styles.row, justifyContent: "flex-start" }}>
        <View
          style={{
            marginTop: -60,
            marginLeft: -25,
            marginRight: 10,
            width: 60,
            height: 60,
            borderRadius: 40,
            backgroundColor,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
          }}
        >
          <Text style={{ fontSize: 30 }}>{AchievementConfig[level].logo}</Text>
        </View>
        <View style={{ alignItems: "flex-start", marginLeft: -20 }}>
          <Parallelogram
            backgroundColor={highlight}
            color={"white"}
            textStyle={{
              fontSize: 22,
              fontWeight: "bold",
              fontStyle: "italic",
            }}
            containerStyle={{ height: 45, marginTop: -30 }}
          >
            Mission
          </Parallelogram>
          <Parallelogram
            backgroundColor={corporateColor}
            color={"white"}
            containerStyle={{ height: 30, marginTop: 0, marginLeft: -20 }}
          >
            Level {level + 1 + ": " + AchievementConfig[level].name}
          </Parallelogram>
        </View>
      </View>
      <Space size={10} />
      {tasks &&
        tasks.map((task, key) => {
          return (
            <View
              key={key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              {!!task.value ? (
                <CheckboxIcon size={16} color="white" />
              ) : (
                <CircleIcon size={16} color="white" />
              )}
              <Text
                style={{
                  fontSize: 16,
                  padding: 5,
                  paddingLeft: 20,
                  ...styles.whiteText,
                }}
              >
                {task.verbose}
              </Text>
            </View>
          );
        })}
    </View>
  );
};

export default AchievementComponent;
