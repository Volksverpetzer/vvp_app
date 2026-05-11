import BaseStore from "#/helpers/Storage";
import type { StatisticsType } from "#/types";

const STATS_KEYS = {
  articlesRead: "articlesRead",
  articlesShared: "articlesShared",
  sourcesChecked: "sourcesChecked",
  appOpened: "appOpened",
} as const;

export type StatsKeyType = keyof typeof STATS_KEYS;

const StatisticsStore = {
  keys: STATS_KEYS,

  async getStatistics(key: StatsKeyType): Promise<StatisticsType> {
    try {
      const jsonValue = await BaseStore.getItem(StatisticsStore.keys[key]);
      return BaseStore.parseJSON(jsonValue, {
        streak: 0,
        lastDate: 0,
        count: 0,
      });
    } catch (error) {
      console.error("Error retrieving statistics:", error);
      return { streak: 0, lastDate: 0, count: 0 };
    }
  },

  async setStatistics(key: StatsKeyType, value: StatisticsType): Promise<void> {
    try {
      await BaseStore.setItem(StatisticsStore.keys[key], JSON.stringify(value));
    } catch (error) {
      console.error("Error saving statistics:", error);
    }
  },
};

export default StatisticsStore;
