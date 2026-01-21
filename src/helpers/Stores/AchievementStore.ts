import BaseStore from "../Storage";

const AchievementStore = {
  /**
   * Gets the value of an achievement.
   * @param key The key of the achievement.
   * @returns The value of the achievement.
   */
  async getAchievementValue(key: string) {
    const value = await BaseStore.getItem(key);
    return value === "true";
  },

  /**
   * Sets the value of an achievement.
   * @param key The key of the achievement.
   * @param value The value to set.
   */
  async setAchievementValue(key: string, value: boolean) {
    await BaseStore.setItem(key, String(value));
  },

  /**
   * Sets the level of the user.
   * @param level The level to set.
   */
  async setLevel(level: number) {
    await BaseStore.setItem("level", String(level));
  },

  /**
   * Gets the level of the user.
   * @returns The level of the user.
   */
  async getLevel() {
    const value = await BaseStore.getItem("level");
    return Number.parseInt(value) || 0;
  },
};

export default AchievementStore;
