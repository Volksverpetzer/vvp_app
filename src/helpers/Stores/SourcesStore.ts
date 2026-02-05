import { Achievements } from "#/helpers/Achievements";
import BaseStore from "#/helpers/Storage";
import { HttpsUrl, StoredSources } from "#/types";

/**
 * Manages stored sources in a persistent storage.
 */
const SourcesStore = {
  sourcesKey: "sources",

  /**
   * Adds a new source to the stored sources.
   *
   * @param source - The URL of the source in the format `https://${string}`.
   * @param slug - A unique identifier for the source.
   * @param text - Optional additional text associated with the source.
   */
  async onAddSource(source: HttpsUrl, slug: string, text?: string) {
    const storedSourcesJson =
      (await BaseStore.getItem(this.sourcesKey)) ?? undefined;
    const storedSources: StoredSources = BaseStore.parseJSON(
      storedSourcesJson,
      {},
    );
    const date = new Date().toISOString();
    const newStoredSources = {
      ...storedSources,
      [source]: { slug, text, date },
    };
    await BaseStore.setItem(this.sourcesKey, JSON.stringify(newStoredSources));
    Achievements.setAchievementValue("checksource");
  },

  /**
   * Retrieves all stored sources.
   *
   * @returns A promise that resolves to a `StoredSources` object containing the
   *          sources and their associated data.
   */
  async getAllSources(): Promise<StoredSources> {
    const storedSourcesJson =
      (await BaseStore.getItem(this.sourcesKey)) ?? undefined;
    return BaseStore.parseJSON(storedSourcesJson, {});
  },

  /**
   * Removes a source by its URL from the stored sources.
   *
   * @param source - The URL of the source to remove in the format `https://${string}`.
   */
  async removeSource(source: HttpsUrl): Promise<void> {
    const storedSourcesJson =
      (await BaseStore.getItem(this.sourcesKey)) ?? undefined;
    const storedSources: StoredSources =
      BaseStore.parseJSON(storedSourcesJson, {}) ?? ({} as StoredSources);
    if (storedSources && storedSources[source]) {
      delete storedSources[source];
      await BaseStore.setItem(this.sourcesKey, JSON.stringify(storedSources));
    }
  },
};

export default SourcesStore;
