import BaseStore from "#/helpers/Storage";
import type { StatisticsType } from "#/types";

/**
 * Define the stats keys as a const object to enable type checking
 */
const STATS_KEYS = {
  articlesRead: "articlesRead",
  articlesShared: "articlesShared",
  sourcesChecked: "sourcesChecked",
  appOpened: "appOpened",
} as const;

/**
 * Type for the statistic keys
 */
export type StatsKeyType = keyof typeof STATS_KEYS;

/**
 * Stores and retrieves user statistics in local storage.
 *
 * This class provides methods to get and set user statistics, which are stored
 * as JSON objects in local storage. The keys used to store the statistics are
 * defined in the `keys` property.
 */
const StatisticsStore = {
  keys: STATS_KEYS,

  /**
   * Retrieves a user's statistics from local storage for the specified key.
   *
   * @param key - The key associated with the statistic (e.g., 'articlesRead', 'articlesShared', etc.).
   * @returns {Promise<StatisticsType>} A promise that resolves to the StatisticsType object retrieved from storage.
   */
  async getStatistics(key: StatsKeyType): Promise<StatisticsType> {
    const jsonValue = await BaseStore.getItem(StatisticsStore.keys[key]);
    return BaseStore.parseJSON(jsonValue, {
      streak: 0,
      lastDate: 0,
      count: 0,
    });
  },

  /**
   * Sets a user's statistics in local storage for the specified key.
   *
   * @param key - The key associated with the stat (e.g., 'articlesRead', 'articlesShared', etc.).
   * @param value - The StatsType object to be stored.
   */
  setStatistics: async (
    key: StatsKeyType,
    value: StatisticsType,
  ): Promise<void> => {
    await BaseStore.setItem(StatisticsStore.keys[key], JSON.stringify(value));
  },
};

export default StatisticsStore;
