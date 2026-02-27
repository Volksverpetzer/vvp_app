import BaseStore from "#/helpers/Storage";
import type { BadgeState } from "#/helpers/provider/BadgeProvider";

/**
 * Class for managing badge-related state.
 */
const BadgeStore = {
  /**
   * Key used to store the badge state in local storage.
   */
  key: "badge",

  /**
   * Default initial state of the badge.
   */
  defaultState: {
    action: false,
    personal: false,
  } as BadgeState,

  /**
   * Sets the badge state asynchronously and saves it to storage.
   *
   * @param {BadgeState} badgeState - The new badge state to be set.
   */
  async setBadgeStore(badgeState: BadgeState) {
    const jsonValue = JSON.stringify(badgeState);
    await BaseStore.setItem(this.key, jsonValue);
  },

  /**
   * Gets the stored badge state asynchronously and parses it into a `BadgeState` object.
   *
   * @returns {Promise<BadgeState>} - The parsed badge state.
   */
  async getBadgeStore(): Promise<BadgeState> {
    const jsonValue = await BaseStore.getItem(this.key);
    return BaseStore.parseJSON<BadgeState>(jsonValue, {
      action: false,
      personal: false,
    });
  },
};

export default BadgeStore;
