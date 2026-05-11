import { Achievements } from "#/helpers/Achievements";
import BaseStore from "#/helpers/Storage";
import type { HttpsUrl, StoredSources } from "#/types";

const SourcesStore = {
  sourcesKey: "sources",

  async onAddSource(
    source: HttpsUrl,
    slug: string,
    text?: string,
  ): Promise<void> {
    try {
      const storedSourcesJson =
        (await BaseStore.getItem(this.sourcesKey)) ?? undefined;
      const storedSources: StoredSources = BaseStore.parseJSON(
        storedSourcesJson,
        {},
      );
      const date = new Date().toISOString();
      await BaseStore.setItem(
        this.sourcesKey,
        JSON.stringify({ ...storedSources, [source]: { slug, text, date } }),
      );
      Achievements.setAchievementValue("checksource");
    } catch (error) {
      console.error("Error adding source:", error);
    }
  },

  async getAllSources(): Promise<StoredSources> {
    try {
      const storedSourcesJson =
        (await BaseStore.getItem(this.sourcesKey)) ?? undefined;
      return BaseStore.parseJSON(storedSourcesJson, {});
    } catch (error) {
      console.error("Error retrieving sources:", error);
      return {};
    }
  },

  async setStoredSources(sources: StoredSources): Promise<void> {
    try {
      await BaseStore.setItem(this.sourcesKey, JSON.stringify(sources));
    } catch (error) {
      console.error("Error saving sources:", error);
    }
  },

  async removeSource(source: HttpsUrl): Promise<void> {
    try {
      const storedSourcesJson =
        (await BaseStore.getItem(this.sourcesKey)) ?? undefined;
      const storedSources: StoredSources = BaseStore.parseJSON(
        storedSourcesJson,
        {},
      );
      if (storedSources[source]) {
        const { [source]: _removed, ...rest } = storedSources;
        await BaseStore.setItem(this.sourcesKey, JSON.stringify(rest));
      }
    } catch (error) {
      console.error("Error removing source:", error);
    }
  },
};

export default SourcesStore;
