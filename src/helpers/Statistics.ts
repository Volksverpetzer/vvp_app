import type { StatisticsType } from "#/types";

import { Achievements } from "./Achievements";
import StatisticsStore, { StatsKeyType } from "./Stores/StatisticsStore";
import { WEEK_IN_MS } from "./utils/time";

const Statistics = {
  /**
   * Update the statistics for a specific key.
   * @param key - The key to update the count and (maybe) the streak for
   * @param condition - An optional condition function to execute after counting the streak
   */
  async updateData(
    key: StatsKeyType,
    condition?: (statistic: StatisticsType) => Promise<void> | void,
  ): Promise<void> {
    const currentDate = new Date();

    const statistic = await StatisticsStore.getStatistics(key);
    statistic.count += 1;

    // Init stat if lastDate is empty
    if (!statistic.lastDate) {
      statistic.lastDate = currentDate.getTime();
    }

    const lastStreakDate = new Date(statistic.lastDate);
    const timeDifference = currentDate.getTime() - lastStreakDate.getTime();

    if (timeDifference >= WEEK_IN_MS * 2) {
      statistic.streak = 1;
      statistic.lastDate = currentDate.getTime();
    } else if (timeDifference >= WEEK_IN_MS) {
      statistic.streak += 1;
      statistic.lastDate = currentDate.getTime();

      if (condition) {
        await condition(statistic);
      }
    }

    await StatisticsStore.setStatistics(key, statistic);
  },

  /**
   * Update the article read data.
   */
  countArticleRead: () => {
    return Statistics.updateData(StatisticsStore.keys.articlesRead);
  },

  /**
   * Update the article shared data.
   */
  countArticleShared: () => {
    return Statistics.updateData(StatisticsStore.keys.articlesShared);
  },

  /**
   * Update the source checked data.
   */
  countSourceChecked: () => {
    return Statistics.updateData(StatisticsStore.keys.sourcesChecked);
  },

  /**
   * Update the app opened data.
   */
  countAppOpened: () => {
    return Statistics.updateData(
      StatisticsStore.keys.appOpened,
      async (statistic) => {
        if (statistic.streak === 4) {
          await Achievements.setAchievementValue("connaisseur");
        }
      },
    );
  },

  /**
   * Retrieves all statistics.
   * @returns {Promise<Record<string, StatisticsType>>} An object containing all statistics.
   */
  getAllStatistics: async (): Promise<Record<string, StatisticsType>> => {
    const keys = Object.values(StatisticsStore.keys);
    const statisticsEntries = await Promise.all(
      keys.map(async (key) => {
        const statistic = await StatisticsStore.getStatistics(key);
        return [key, statistic] as [string, StatisticsType];
      }),
    );
    return Object.fromEntries(statisticsEntries);
  },
};

export default Statistics;
