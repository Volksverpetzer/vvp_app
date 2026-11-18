import BaseStore from "#/helpers/Storage";
import type { FavPayload, FaveableType, HttpsUrl, StoredFavs } from "#/types";

// Serializes every favorites write (add, remove, backup import): a quick
// double tap or several removals in MyFavs would otherwise read the same
// stored object, and the later write would undo the earlier change.
let pendingWrite: Promise<void> = Promise.resolve();

const enqueueWrite = (write: () => Promise<void>): Promise<void> => {
  pendingWrite = pendingWrite.then(write).catch((error) => {
    console.error("Error updating favorites:", error);
  });
  return pendingWrite;
};

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
   * @param {HttpsUrl} [originalUrl] Full source URL, used to reload favorites
   *   from a secondary WordPress feed (e.g. Prüfpunkt) from the correct site.
   * @param {InstaPostProperties} [payload] Snapshot of an Instagram post so it
   *   can be rebuilt without the account-scoped by-id proxy (see StoredFav).
   */
  addFavorite(
    contentFavIdentifier: string,
    contentType: FaveableType,
    originalUrl?: HttpsUrl,
    payload?: FavPayload,
  ): Promise<void> {
    return enqueueWrite(async () => {
      const storedFavs = await this.getStoredFavs();
      const newStoredFavs = {
        ...storedFavs,
        [contentFavIdentifier]: {
          contentType,
          ...(originalUrl && { originalUrl }),
          ...(payload && { payload }),
        },
      };
      await this.setStoredFavs(newStoredFavs);
    });
  },

  /**
   * Replaces all favorites (e.g. on backup import), queued behind any pending
   * add or remove so neither overwrites the other with stale data.
   * @param {StoredFavs} favs The favorites object to store.
   */
  replaceFavorites(favs: StoredFavs): Promise<void> {
    return enqueueWrite(() => this.setStoredFavs(favs));
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
  removeFavorite(contentFavIdentifier: string): Promise<void> {
    return enqueueWrite(async () => {
      const storedFavs = await this.getStoredFavs();
      if (contentFavIdentifier in storedFavs) {
        delete storedFavs[contentFavIdentifier];
        await this.setStoredFavs(storedFavs);
      }
    });
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
