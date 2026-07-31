import Config from "#/constants/Config";
import BaseStore from "#/helpers/Storage";
import { getInstaFeedKey, getWpFeedKey } from "#/helpers/utils/feeds";
import type {
  AdvancedSettingType,
  ContentSettingType,
  NotificationSettingType,
} from "#/types";

const wpFeeds = Config.feeds?.wp ?? [];
const instaFeeds = Config.feeds?.insta ?? [];

// Every configured WordPress/Instagram feed gets its own settings entry,
// defaulting to "on" so onboarding presents them enabled.
const perFeedContentDefaults = Object.fromEntries([
  ...wpFeeds.map((entry) => [
    getWpFeedKey(entry),
    { value: true, name: entry.label },
  ]),
  ...instaFeeds.map((entry) => [
    getInstaFeedKey(entry),
    { value: true, name: entry.label },
  ]),
]);

// Settings were previously stored under the static keys "wp" and "insta";
// map them onto the first configured wp/insta feed entries. (The "wp2" key
// from early Prüfpunkt builds never shipped to production, so there is
// nothing to migrate from it.)
const legacyFeedKeys: Record<string, string> = Object.fromEntries([
  ...wpFeeds.slice(0, 1).map((entry) => [getWpFeedKey(entry), "wp"]),
  ...instaFeeds.slice(0, 1).map((entry) => [getInstaFeedKey(entry), "insta"]),
]);

const SettingsStore = {
  defaultContentSettings: {
    reddit: { value: true, name: "Memes" },
    yt: { value: true, name: "YouTube Videos" },
    tiktok: { value: true, name: "TikTok Videos" },
    bsky: { value: false, name: "Bluesky Posts" },
    bot: { value: true, name: "Bot Feed" },
    podcast: { value: true, name: "Podcast Folgen" },
    ...perFeedContentDefaults,
  } satisfies ContentSettingType,

  keys: {
    contentSettings: "contentSettings",
    advancedSettings: "advancedSettings",
    notificationSettings: "notificationSettings",
  },

  defaultAdvancedSettings: {
    advancedReporting: { value: false, name: "Erweitertes Reporting" },
    alwaysDarkMode: { value: false, name: "Immer Dark Mode" },
  } satisfies AdvancedSettingType,

  defaultNotificationSettings: {
    new_post: { value: true, name: "Neuer Artikel" },
    new_fact_check: { value: true, name: "Neuer Faktencheck" },
    new_pruefpunkt: { value: true, name: "Neuer Prüfpunkt Artikel" },
  } satisfies NotificationSettingType,

  async getContentSettings(): Promise<ContentSettingType> {
    try {
      const jsonValue = await BaseStore.getItem(this.keys.contentSettings);
      const parsed = BaseStore.parseJSON<Record<string, unknown>>(
        jsonValue,
        {},
      );
      const result = {} as ContentSettingType;
      const newStore: Record<string, boolean> = {};
      for (const key in this.defaultContentSettings) {
        const defaultSetting = this.defaultContentSettings[key];
        const legacyKey = legacyFeedKeys[key];
        const raw = parsed[key] ?? (legacyKey ? parsed[legacyKey] : undefined);
        const value =
          typeof raw === "boolean"
            ? raw
            : ((raw as { value?: boolean } | undefined)?.value ??
              defaultSetting.value);
        result[key] = { value: value, name: defaultSetting.name };
        newStore[key] = value;
      }
      // Migrate storage to boolean-only shape
      await BaseStore.setItem(
        this.keys.contentSettings,
        JSON.stringify(newStore),
      );
      return result;
    } catch (error) {
      console.error("Error retrieving content settings:", error);
      return this.defaultContentSettings;
    }
  },

  async getAdvancedSettings(): Promise<AdvancedSettingType> {
    try {
      const jsonValue = await BaseStore.getItem(this.keys.advancedSettings);
      return BaseStore.parseJSON(jsonValue, this.defaultAdvancedSettings);
    } catch (error) {
      console.error("Error retrieving advanced settings:", error);
      return this.defaultAdvancedSettings;
    }
  },

  async setContentSettings(settings: ContentSettingType) {
    try {
      const bools: Record<string, boolean> = {};
      for (const key in settings) {
        bools[key] = settings[key].value;
      }
      await BaseStore.setItem(this.keys.contentSettings, JSON.stringify(bools));
    } catch (error) {
      console.error("Error saving content settings:", error);
    }
  },

  async setAdvancedSettings(settings: AdvancedSettingType) {
    try {
      await BaseStore.setItem(
        this.keys.advancedSettings,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Error saving advanced settings:", error);
    }
  },

  async setNotificationSettings(settings: NotificationSettingType) {
    try {
      await BaseStore.setItem(
        this.keys.notificationSettings,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  },

  async getNotificationSettings(): Promise<NotificationSettingType> {
    try {
      const jsonValue = await BaseStore.getItem(this.keys.notificationSettings);
      const stored =
        BaseStore.parseJSON<Partial<NotificationSettingType>>(jsonValue, {}) ??
        {};
      // Merge defaults so settings added later (e.g. new_pruefpunkt) appear for
      // users whose stored settings predate them.
      return { ...this.defaultNotificationSettings, ...stored };
    } catch (error) {
      console.error("Error retrieving notification settings:", error);
      return this.defaultNotificationSettings;
    }
  },
};

export default SettingsStore;
