import BaseStore from "#/helpers/Storage";
import {
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

  /**
   * Default advanced settings.
   *
   * @type {AdvancedSettingType}
   * @property {SettingType} alwaysDarkMode - Indicates if always dark mode is enabled.
   */
  defaultAdvancedSettings: {
    advancedReporting: { value: false, name: "Erweitertes Reporting" },
    alwaysDarkMode: { value: false, name: "Immer Dark Mode" },
  } as AdvancedSettingType,

  /**
   * Represents the default notification settings.
   *
   * @type {NotificationSettingType}
   * @property {SettingType} new_post - Indicates whether new post notifications are enabled.
   * @property {SettingType} new_fact_check - Indicates whether new fact check notifications are enabled.
   */
  defaultNotificationSettings: {
    new_post: { value: true, name: "Neuer Artikel" },
    new_fact_check: { value: true, name: "Neuer Faktencheck" },
  } as NotificationSettingType,

  /**
   * Retrieves the content settings from AsyncStorage.
   * @returns A promise that resolves to a contentSettingType object representing the content settings.
   */
  async getContentSettings(): Promise<ContentSettingType> {
    const jsonValue = await BaseStore.getItem(this.keys.contentSettings);
    const parsed = BaseStore.parseJSON<Record<string, any>>(jsonValue, {});
    const result: ContentSettingType = {} as any;
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
  },

  /**
   * Retrieves the advanced settings from AsyncStorage.
   * @returns {Promise<AdvancedSettingType>} The advanced settings.
   */
  async getAdvancedSettings(): Promise<AdvancedSettingType> {
    const jsonValue = await BaseStore.getItem(this.keys.advancedSettings);
    return BaseStore.parseJSON(jsonValue, this.defaultAdvancedSettings);
  },

  /**
   * Stores the content settings in AsyncStorage.
   * @param {ContentSettingType} settings - The content settings to store.
   */
  async setContentSettings(settings: ContentSettingType) {
    // Persist only the boolean values
    const bools: Record<string, boolean> = {};
    for (const key in settings) {
      bools[key] = settings[key].value;
    }
    await BaseStore.setItem(this.keys.contentSettings, JSON.stringify(bools));
  },

  /**
   * Stores the advanced settings in AsyncStorage.
   * @param {AdvancedSettingType} settings - The advanced settings to store.
   */
  async setAdvancedSettings(settings: AdvancedSettingType) {
    await BaseStore.setItem(
      this.keys.advancedSettings,
      JSON.stringify(settings),
    );
  },

  /**
   * Stores the notification settings in AsyncStorage.
   * @param {NotificationSettingType} settings - The notification settings to store.
   */
  async setNotificationSettings(settings: NotificationSettingType) {
    await BaseStore.setItem(
      this.keys.notificationSettings,
      JSON.stringify(settings),
    );
  },

  /**
   * Retrieves the notification settings from AsyncStorage.
   * @returns {Promise<NotificationSettingType>} The notification settings.
   */
  async getNotificationSettings(): Promise<NotificationSettingType> {
    const jsonValue = await BaseStore.getItem(this.keys.notificationSettings);
    return BaseStore.parseJSON(jsonValue, this.defaultNotificationSettings);
  },
};

export default SettingsStore;
