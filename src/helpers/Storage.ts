import AsyncStorage from "@react-native-async-storage/async-storage";

const BaseStore = {
  /**
   * Sets an item in AsyncStorage.
   * @param {string} key - The key to store the item under.
   * @param {string} value - The value to store.
   * @returns {Promise<void>} A promise that resolves when the item is stored.
   */
  async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Retrieves an item from AsyncStorage.
   * @param {string} key - The key of the item to retrieve.
   * @returns {Promise<string | undefined>} A promise that resolves to the value of the item, or undefined if the item does not exist.
   */
  async getItem(key: string): Promise<string | undefined> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return value;
      }
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Checks whether a key is stored. Unlike getItem, read errors are not
   * swallowed, so callers can tell a missing key from a failed read.
   * @param {string} key - The key to check.
   * @returns {Promise<boolean>} True if a value is stored under the key.
   * @throws If AsyncStorage fails to read.
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await AsyncStorage.getItem(key);
    return value !== null && value !== undefined;
  },

  /**
   * Safely parses a JSON string.
   * @param {string | undefined} json - The JSON string to parse.
   * @param {T} defaultValue - The default value if parsing fails.
   * @returns {T} The parsed value or the default.
   */
  parseJSON<T>(json: string | undefined, defaultValue?: T): T | undefined {
    if (!json) return defaultValue;
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return defaultValue;
    }
  },

  /**
   * Removes a single item from AsyncStorage.
   * @param {string} key - The key of the item to remove.
   */
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Removes all items from AsyncStorage that start with the given prefix.
   * @param {string} prefix - The prefix to remove items with.
   */
  async removePrefixedItems(prefix: string) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter((key) => key.startsWith(prefix));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error("Error removing prefixed items:", error);
    }
  },
};

export default BaseStore;
