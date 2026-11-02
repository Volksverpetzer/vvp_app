import Config from "#/constants/Config";
import BaseStore from "#/helpers/Storage";
import { getInstaFeedKey, getWpFeedKey } from "#/helpers/utils/feeds";
import type {
  AdvancedSettingType,
  ContentSettingType,
  NotificationSettingType,
  ThemePreference,
} from "#/types";

const themePreferences: ReadonlySet<ThemePreference> = new Set([
  "system",
  "light",
  "dark",
]);

const hiddenNotifications = Config.hiddenNotifications ?? [];

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
    themePreference: "themePreference",
  },

  defaultThemePreference: "system" as ThemePreference,

  defaultAdvancedSettings: {
    advancedReporting: { value: false, name: "Erweitertes Reporting" },
  } satisfies AdvancedSettingType,

  // Types a variant doesn't offer stay in the payload (the server requires
  // the keys) but are always off, since the user has no switch for them.
  defaultNotificationSettings: {
    new_post: { value: true, name: "Neuer Artikel" },
    new_fact_check: {
      value: !hiddenNotifications.includes("new_fact_check"),
      name: "Neuer Faktencheck",
    },
    new_pruefpunkt: {
      value: !hiddenNotifications.includes("new_pruefpunkt"),
      name: "Neuer Prüfpunkt Artikel",
    },
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
      const stored =
        BaseStore.parseJSON<Record<string, unknown>>(jsonValue, {}) ?? {};
      // Only keep known keys — stored payloads from older builds may still
      // carry removed settings (e.g. "alwaysDarkMode"), which would otherwise
      // show up as orphaned switches.
      const result = { ...this.defaultAdvancedSettings };
      for (const key of Object.keys(result) as (keyof AdvancedSettingType)[]) {
        const raw = stored[key] as { value?: unknown } | undefined;
        if (typeof raw?.value === "boolean") {
          result[key] = { ...result[key], value: raw.value };
        }
      }
      return result;
    } catch (error) {
      console.error("Error retrieving advanced settings:", error);
      return this.defaultAdvancedSettings;
    }
  },

  /**
   * Reads the theme preference. Users of earlier builds who had enabled the
   * "Immer Dark Mode" switch (stored in the advanced settings) are migrated
   * to "dark".
   */
  async getThemePreference(): Promise<ThemePreference> {
    try {
      // Read both keys up front: the advanced settings are rewritten (without
      // the legacy switch) as soon as the SettingsProvider mounts.
      const [storedValue, advancedJson] = await Promise.all([
        BaseStore.getItem(this.keys.themePreference),
        BaseStore.getItem(this.keys.advancedSettings),
      ]);
      if (themePreferences.has(storedValue as ThemePreference)) {
        return storedValue as ThemePreference;
      }
      const legacy = BaseStore.parseJSON<{
        alwaysDarkMode?: { value?: boolean };
      }>(advancedJson, {});
      const preference: ThemePreference =
        legacy?.alwaysDarkMode?.value === true
          ? "dark"
          : this.defaultThemePreference;
      await this.setThemePreference(preference);
      return preference;
    } catch (error) {
      console.error("Error retrieving theme preference:", error);
      return this.defaultThemePreference;
    }
  },

  async setThemePreference(preference: ThemePreference) {
    try {
      await BaseStore.setItem(this.keys.themePreference, preference);
    } catch (error) {
      console.error("Error saving theme preference:", error);
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

  /**
   * Types the variant doesn't offer have no switch, so a stored `true` (from
   * an earlier build) could never be turned off — force them off.
   */
  forceHiddenNotificationsOff(
    settings: NotificationSettingType,
  ): NotificationSettingType {
    const result = { ...settings };
    for (const key of hiddenNotifications) {
      result[key] = { ...result[key], value: false };
    }
    return result;
  },

  async getNotificationSettings(): Promise<NotificationSettingType> {
    try {
      const jsonValue = await BaseStore.getItem(this.keys.notificationSettings);
      const stored =
        BaseStore.parseJSON<Partial<NotificationSettingType>>(jsonValue, {}) ??
        {};
      // Merge defaults so settings added later (e.g. new_pruefpunkt) appear for
      // users whose stored settings predate them.
      return this.forceHiddenNotificationsOff({
        ...this.defaultNotificationSettings,
        ...stored,
      });
    } catch (error) {
      console.error("Error retrieving notification settings:", error);
      return this.defaultNotificationSettings;
    }
  },
};

export default SettingsStore;
