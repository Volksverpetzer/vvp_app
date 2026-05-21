import BaseStore from "#/helpers/Storage";
import type {
  AdvancedSettingType,
  ContentSettingType,
  NotificationSettingType,
} from "#/types";

const SettingsStore = {
  defaultContentSettings: {
    reddit: { value: true, name: "Memes" },
    wp: { value: true, name: "Artikel" },
    insta: { value: true, name: "Instagram Slides" },
    yt: { value: true, name: "YouTube Videos" },
    tiktok: { value: true, name: "TikTok Videos" },
    bsky: { value: false, name: "Bluesky Posts" },
    bot: { value: true, name: "Bot Feed" },
  },

  keys: {
    contentSettings: "contentSettings",
    advancedSettings: "advancedSettings",
    notificationSettings: "notificationSettings",
  },

  defaultAdvancedSettings: {
    advancedReporting: { value: false, name: "Erweitertes Reporting" },
    alwaysDarkMode: { value: false, name: "Immer Dark Mode" },
  } as AdvancedSettingType,

  defaultNotificationSettings: {
    new_post: { value: true, name: "Neuer Artikel" },
    new_fact_check: { value: true, name: "Neuer Faktencheck" },
  } as NotificationSettingType,

  async getContentSettings(): Promise<ContentSettingType> {
    try {
      const jsonValue = await BaseStore.getItem(this.keys.contentSettings);
      const parsed = BaseStore.parseJSON<Record<string, any>>(jsonValue, {});
      const result = {} as ContentSettingType;
      const newStore: Record<string, boolean> = {};
      for (const key in this.defaultContentSettings) {
        const defaultSetting = this.defaultContentSettings[key];
        const value =
          typeof parsed[key] === "boolean"
            ? parsed[key]
            : (parsed[key]?.value ?? defaultSetting.value);
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
      return BaseStore.parseJSON(jsonValue, this.defaultNotificationSettings);
    } catch (error) {
      console.error("Error retrieving notification settings:", error);
      return this.defaultNotificationSettings;
    }
  },
};

export default SettingsStore;
