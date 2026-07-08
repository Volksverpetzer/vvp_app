import BaseStore from "#/helpers/Storage";
import type { BadgeState } from "#/helpers/provider/BadgeProvider";

const BadgeStore = {
  key: "badge",

  defaultState: {
    action: false,
    personal: false,
    // Highlights the new contact tab until it is opened once
    contact: true,
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
      // Merge over the defaults so newly introduced badges (missing in an
      // older stored state) start with their default value; ignore stored
      // values that parse to something other than an object
      const parsed = BaseStore.parseJSON<Partial<BadgeState>>(jsonValue, {});
      return {
        ...this.defaultState,
        ...(parsed && typeof parsed === "object" ? parsed : {}),
      };
    } catch (error) {
      console.error("Error retrieving badge state:", error);
      return this.defaultState;
    }
  },
};

export default BadgeStore;
