import BaseStore from "#/helpers/Storage";
import { StoredReports } from "#/types";

const PersonalStore = {
  keys: {
    onboardingDone: "onboarded",
    reports: "reports",
    scrollPosition: "scrollPosition",
    longPressTip: "longPressTip",
  },

  /**
   * Constructs the key for scroll position storage for a given slug.
   * @param {string} slug - The slug for which to create the key.
   * @returns {string} The storage key.
   */
  getScrollKey(slug: string): string {
    return `${this.keys.scrollPosition}_${slug}`;
  },

  /**
   * Checks if the onboarding process is done.
   * @returns {Promise<boolean>} True if onboarding is done, false otherwise.
   */
  async isOnboardingDone(): Promise<boolean> {
    try {
      const value = await BaseStore.getItem(this.keys.onboardingDone);
      return value === "true";
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  },

  /**
   * Sets the onboarding status (default: to true).
   * @param {boolean} [value=true] - The onboarding status to set.
   */
  async setOnboardingDone(value = true): Promise<void> {
    try {
      await BaseStore.setItem(this.keys.onboardingDone, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting onboarding status:", error);
    }
  },

  /**
   * Stores the reports.
   * @param {StoredReports} reports - The reports to store.
   */
  async setReports(reports: StoredReports): Promise<void> {
    try {
      await BaseStore.setItem(this.keys.reports, JSON.stringify(reports));
    } catch (error) {
      console.error("Error saving reports:", error);
    }
  },

  /**
   * Retrieves the reports.
   * @returns {Promise<StoredReports>} The stored reports.
   */
  async getReports(): Promise<StoredReports> {
    try {
      const jsonValue = await BaseStore.getItem(this.keys.reports);
      return BaseStore.parseJSON<StoredReports>(jsonValue, []);
    } catch (error) {
      console.error("Error retrieving reports:", error);
      return [];
    }
  },

  /**
   * Stores the scroll position for a specific slug.
   * @param {number} position - The scroll position to store.
   * @param {string} slug - The slug associated with the scroll position.
   */
  async setScrollPosition(position: number, slug: string): Promise<void> {
    try {
      const key = this.getScrollKey(slug);
      await BaseStore.setItem(key, JSON.stringify(position));
    } catch (error) {
      console.error("Error setting scroll position:", error);
    }
  },

  /**
   * Retrieves the scroll position for a specific slug.
   * @param {string} slug - The slug associated with the scroll position.
   * @returns {Promise<number>} The stored scroll position.
   */
  async getScrollPosition(slug: string): Promise<number> {
    try {
      const key = this.getScrollKey(slug);
      const jsonValue = await BaseStore.getItem(key);
      return BaseStore.parseJSON<number>(jsonValue, 0);
    } catch (error) {
      console.error("Error retrieving scroll position:", error);
      return 0;
    }
  },
};

export default PersonalStore;
