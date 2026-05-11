import BaseStore from "#/helpers/Storage";
import type { BadgeState } from "#/helpers/provider/BadgeProvider";

const BadgeStore = {
  key: "badge",

  defaultState: {
    action: false,
    personal: false,
  } as BadgeState,

  async setBadgeStore(badgeState: BadgeState) {
    try {
      await BaseStore.setItem(this.key, JSON.stringify(badgeState));
    } catch (error) {
      console.error("Error saving badge state:", error);
    }
  },

  async getBadgeStore(): Promise<BadgeState> {
    try {
      const jsonValue = await BaseStore.getItem(this.key);
      return BaseStore.parseJSON<BadgeState>(jsonValue, {
        action: false,
        personal: false,
      });
    } catch (error) {
      console.error("Error retrieving badge state:", error);
      return { action: false, personal: false };
    }
  },
};

export default BadgeStore;
