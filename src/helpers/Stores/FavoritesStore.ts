import BaseStore from "#/helpers/Storage";
import { FaveableType, StoredFavs } from "#/types";

const FavoritesStore = {
  favKey: "favs",

  /**
   * Retrieves the stored favorites from AsyncStorage.
   * @returns {Promise<StoredFavs>} The stored favorites object.
   */
  async getStoredFavs(): Promise<StoredFavs> {
    try {
      const storedFavsJson = await BaseStore.getItem(this.favKey);
      return BaseStore.parseJSON(storedFavsJson, {});
    } catch (error) {
      console.error("Error retrieving stored favorites:", error);
      return {};
    }
  },

  /**
   * Persists the favorites object to AsyncStorage.
   * @param {StoredFavs} favs The favorites object to store.
   */
  async setStoredFavs(favs: StoredFavs): Promise<void> {
    try {
      await BaseStore.setItem(this.favKey, JSON.stringify(favs));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  },

  /**
   * Adds a new favorite to storage.
   * @param {string} contentFavIdentifier The unique identifier for the content.
   * @param {FaveableType} contentType The type of content.
   */
  async addFavorite(
    contentFavIdentifier: string,
    contentType: FaveableType,
  ): Promise<void> {
    const storedFavs = await this.getStoredFavs();
    const newStoredFavs = {
      ...storedFavs,
      [contentFavIdentifier]: { contentType },
    };
    await this.setStoredFavs(newStoredFavs);
  },

  /**
   * Checks if a given content identifier is marked as a favorite.
   * @param {string} contentFavIdentifier The unique identifier for the content.
   * @returns {Promise<boolean>} True if the content is a favorite, false otherwise.
   */
  async isFavorite(contentFavIdentifier: string): Promise<boolean> {
    const storedFavs = await this.getStoredFavs();
    return contentFavIdentifier in storedFavs;
  },

  /**
   * Removes a favorite from storage.
   * @param {string} contentFavIdentifier The unique identifier for the content.
   */
  async removeFavorite(contentFavIdentifier: string): Promise<void> {
    const storedFavs = await this.getStoredFavs();
    if (contentFavIdentifier in storedFavs) {
      delete storedFavs[contentFavIdentifier];
      await this.setStoredFavs(storedFavs);
    }
  },

  /**
   * Retrieves all favorites from storage.
   * @returns {Promise<StoredFavs>} The complete favorites object.
   */
  async getAllFavorites(): Promise<StoredFavs> {
    return await this.getStoredFavs();
  },
};

export default FavoritesStore;
