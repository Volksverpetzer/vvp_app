import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

import { updateBadgeState } from "./BadgeContext";
import AchievementStore from "./Stores/AchievementStore";

export type TaskType = {
  name: string; // Title of the Achievement
  value?: boolean; // true if done
  verbose: string; // Description of the Task
};

export type LevelType = {
  name: string; // Name of the Level
  logo?: string; // Emoji for the Level
  level: number; // Level number
  tasks: Record<string, TaskType>;
};

export type AchievementConfigType = LevelType[];

const Level0: Record<string, TaskType> = {
  sharefact: {
    verbose: "Teile einen Artikel",
    name: "Einflussreich",
  },
  checksource: {
    verbose: "Check unsere Quellen",
    name: "Peer Review",
  },
  instashare: {
    verbose: "Teile ein einzelnes Insta-Bild durch langes Drücken",
    name: "Am Drücker",
  },
};

const Level1: Record<string, TaskType> = {
  favorite: {
    verbose: "Markiere einen Artikel als Favorit",
    name: "Lieblings-Artikel",
  },
  search: {
    verbose: "Suche nach einem Artikel",
    name: "Such-Maschine",
  },
  reader: {
    verbose: "Lies einen Artikel bis zum Ende",
    name: "Leseratte",
  },
};

const Level2: Record<string, TaskType> = {
  connaisseur: {
    verbose: "Öffne die App 4 Wochen hintereinander",
    name: "Connaisseur",
  },
  rechercheur: {
    verbose: "Teile einen Fake-News-Link von deinem Browser aus mit der App",
    name: "Rechercheur",
  },
};

const allTasks: Record<string, TaskType> = { ...Level0, ...Level1, ...Level2 };

export const AchievementConfig: AchievementConfigType = [
  {
    name: "Fakten-Maus",
    logo: "🐭",
    level: 0,
    tasks: Level0,
  },
  {
    name: "Fakten-Fuchs",
    logo: "🦊",
    level: 1,
    tasks: Level1,
  },
  {
    name: "Check-Cheetah",
    logo: "🐆",
    level: 2,
    tasks: Level2,
  },
];

export class Achievements {
  /**
   * Always returns the proper “current” level: if the user has
   * completed every task in their stored level, it bumps them up
   * (and fires a toast) before returning the next-level config.
   */
  static readonly getCurrentAchievements = async (): Promise<LevelType> => {
    // 1) load stored level
    let level = await AchievementStore.getLevel();
    let levelConfig = AchievementConfig[level];
    let tasks = { ...levelConfig.tasks };

    // 2) populate each task.value
    for (const key of Object.keys(tasks)) {
      tasks[key].value = await AchievementStore.getAchievementValue(key);
    }

    // 3) check if all done
    const allDone = Object.values(tasks).every((t) => t.value);

    // 4) if complete and not max level, bump and toast
    if (allDone && level < AchievementConfig.length - 1) {
      const newLevel = level + 1;
      await AchievementStore.setLevel(newLevel);
      Achievements.dispatchLevelUpToast(newLevel);

      // reload new level’s config & values
      level = newLevel;
      levelConfig = AchievementConfig[level];
      tasks = { ...levelConfig.tasks };
      for (const key of Object.keys(tasks)) {
        tasks[key].value = await AchievementStore.getAchievementValue(key);
      }
    }

    // 5) return the up‑to‑date config
    return {
      ...levelConfig,
      tasks,
    };
  };

  /**
   * Simply sets one task flag, shows its toast, updates badges,
   * and leaves the level‑up detection to getCurrentAchievements().
   */
  static readonly setAchievementValue = async (
    key: keyof typeof allTasks,
    value = true,
  ) => {
    // only if it’s in the current level
    const level = await AchievementStore.getLevel();
    if (!AchievementConfig[level].tasks[key]) return;

    const already = await AchievementStore.getAchievementValue(key);
    if (already) return;

    await AchievementStore.setAchievementValue(key, value);

    // show the task’s own toast
    Toast.show({
      type: "achievement",
      text1: allTasks[key].name,
      text2: allTasks[key].verbose,
      visibilityTime: 5000,
      autoHide: true,
    });

    updateBadgeState({ action: true });
    await Achievements.getCurrentAchievements();
  };

  /**
   * Calculates the completion percentage of the current level's tasks.
   * Retrieves the current achievements, counts completed tasks,
   * and returns the percentage of tasks completed.
   * @returns {Promise<number>} A promise that resolves to the percentage of completed tasks.
   */
  static readonly progressPercent = async () => {
    const { tasks } = await Achievements.getCurrentAchievements();
    const total = Object.keys(tasks).length;
    const done = Object.values(tasks).filter((t) => t.value).length;
    return Math.round((done / total) * 100);
  };

  static readonly resetEverything = async () => {
    await AchievementStore.setLevel(0);
    for (const key of Object.keys(allTasks)) {
      await AchievementStore.setAchievementValue(key, false);
    }
  };

  static readonly fullFillLevel0 = async () => {
    await AchievementStore.setLevel(0);
    for (const key of Object.keys(AchievementConfig[0].tasks)) {
      await AchievementStore.setAchievementValue(key, true);
    }
    Haptics.notificationAsync();
  };

  /**
   * Dispatches a toast notification after a delay when a user achieves a new level.
   * @param {number} level - The level number achieved.
   */
  private static dispatchLevelUpToast = (level: number) => {
    setTimeout(() => {
      Toast.show({
        type: "achievement",
        text1: "Level Up!",
        text2: `Du bist jetzt ${AchievementConfig[level].name}`,
        visibilityTime: 5000,
        autoHide: true,
      });
    }, 5000);
  };
}
