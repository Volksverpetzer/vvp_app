import BaseStore from "#/helpers/Storage";

const AchievementStore = {
  async getAchievementValue(key: string): Promise<boolean> {
    try {
      const value = await BaseStore.getItem(key);
      return value === "true";
    } catch (error) {
      console.error("Error retrieving achievement:", error);
      return false;
    }
  },

  async setAchievementValue(key: string, value: boolean): Promise<void> {
    try {
      await BaseStore.setItem(key, String(value));
    } catch (error) {
      console.error("Error saving achievement:", error);
    }
  },

  async setLevel(level: number): Promise<void> {
    try {
      await BaseStore.setItem("level", String(level));
    } catch (error) {
      console.error("Error saving level:", error);
    }
  },

  async getLevel(): Promise<number> {
    try {
      const value = await BaseStore.getItem("level");
      return Number.parseInt(value) || 0;
    } catch (error) {
      console.error("Error retrieving level:", error);
      return 0;
    }
  },
};

export default AchievementStore;
