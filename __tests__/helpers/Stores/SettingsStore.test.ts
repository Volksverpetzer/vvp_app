import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import BaseStore from "#/helpers/Storage";
import SettingsStore from "#/helpers/Stores/SettingsStore";
import type {
  AdvancedSettingType,
  ContentSettingType,
  NotificationSettingType,
} from "#/types";

jest.mock("#/helpers/Storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    parseJSON: jest.fn(),
  },
}));

describe("SettingsStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getContentSettings", () => {
    it("returns merged settings with stored boolean values", async () => {
      const stored = { reddit: false, "wp:volksverpetzer.de": true };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await SettingsStore.getContentSettings();

      expect(result.reddit.value).toBe(false);
      expect(result["wp:volksverpetzer.de"].value).toBe(true);
      expect(result.bsky.value).toBe(false); // default
    });

    it("migrates legacy wp/wp2 keys onto the configured wp feeds", async () => {
      const stored = { wp: false, wp2: false };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await SettingsStore.getContentSettings();

      expect(result["wp:volksverpetzer.de"].value).toBe(false);
      expect(result["wp:pruefpunkt.org"].value).toBe(false);

      const storedArg = (BaseStore.setItem as jest.Mock).mock
        .calls[0][1] as string;
      const rewritten = JSON.parse(storedArg);
      expect(rewritten["wp:volksverpetzer.de"]).toBe(false);
      expect(rewritten).not.toHaveProperty("wp");
      expect(rewritten).not.toHaveProperty("wp2");
    });

    it("migrates the legacy insta key onto the first configured insta feed", async () => {
      const stored = { insta: false };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await SettingsStore.getContentSettings();

      expect(result["insta:volksverpetzer"].value).toBe(false);
      expect(result["insta:pruefpunkt"].value).toBe(true); // default
    });

    it("prefers new wp keys over legacy ones", async () => {
      const stored = { "wp:pruefpunkt.org": false, wp2: true };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await SettingsStore.getContentSettings();

      expect(result["wp:pruefpunkt.org"].value).toBe(false);
    });

    it("falls back to object-shaped stored values (migration)", async () => {
      const stored = { reddit: { value: true } };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await SettingsStore.getContentSettings();

      expect(result.reddit.value).toBe(true);
    });

    it("preserves the name from defaults", async () => {
      jest.spyOn(BaseStore, "getItem").mockResolvedValue("{}");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      const result = await SettingsStore.getContentSettings();

      expect(result.reddit.name).toBe("Memes");
      expect(result.bsky.name).toBe("Bluesky Posts");
    });

    it("migrates storage to boolean-only shape", async () => {
      jest.spyOn(BaseStore, "getItem").mockResolvedValue("{}");
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue({});

      await SettingsStore.getContentSettings();

      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "contentSettings",
        expect.stringContaining('"reddit"'),
      );
    });

    it("returns defaults on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await SettingsStore.getContentSettings();

      expect(result).toEqual(SettingsStore.defaultContentSettings);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error retrieving content settings:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("setContentSettings", () => {
    it("stores only boolean values per key", async () => {
      const settings: ContentSettingType = {
        reddit: { value: true, name: "Memes" },
        "wp:volksverpetzer.de": { value: false, name: "Artikel" },
        "insta:volksverpetzer": { value: true, name: "Instagram Slides" },
        "insta:pruefpunkt": { value: true, name: "Prüfpunkt Instagram" },
        yt: { value: true, name: "YouTube Videos" },
        tiktok: { value: true, name: "TikTok Videos" },
        bsky: { value: false, name: "Bluesky Posts" },
        bot: { value: true, name: "Bot Feed" },
        "wp:pruefpunkt.org": { value: true, name: "Prüfpunkt Artikel" },
      };

      await SettingsStore.setContentSettings(settings);

      const storedArg = (BaseStore.setItem as jest.Mock).mock
        .calls[0][1] as string;
      const stored = JSON.parse(storedArg);
      expect(stored.reddit).toBe(true);
      expect(stored["wp:volksverpetzer.de"]).toBe(false);
      expect(stored).not.toHaveProperty("reddit.name");
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await SettingsStore.setContentSettings(
        SettingsStore.defaultContentSettings,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving content settings:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getAdvancedSettings", () => {
    it("returns parsed advanced settings", async () => {
      const settings: AdvancedSettingType = {
        advancedReporting: { value: true, name: "Erweitertes Reporting" },
        alwaysDarkMode: { value: false, name: "Immer Dark Mode" },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(settings));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(settings);

      const result = await SettingsStore.getAdvancedSettings();

      expect(BaseStore.getItem).toHaveBeenCalledWith("advancedSettings");
      expect(result).toEqual(settings);
    });

    it("returns defaults on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await SettingsStore.getAdvancedSettings();

      expect(result).toEqual(SettingsStore.defaultAdvancedSettings);
      consoleSpy.mockRestore();
    });
  });

  describe("setAdvancedSettings", () => {
    it("persists advanced settings as JSON", async () => {
      const settings = SettingsStore.defaultAdvancedSettings;
      await SettingsStore.setAdvancedSettings(settings);
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "advancedSettings",
        JSON.stringify(settings),
      );
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await SettingsStore.setAdvancedSettings(
        SettingsStore.defaultAdvancedSettings,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving advanced settings:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getNotificationSettings", () => {
    it("returns parsed notification settings", async () => {
      const settings: NotificationSettingType = {
        new_post: { value: false, name: "Neuer Artikel" },
        new_fact_check: { value: true, name: "Neuer Faktencheck" },
        new_pruefpunkt: { value: false, name: "Neuer Prüfpunkt Artikel" },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(settings));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(settings);

      const result = await SettingsStore.getNotificationSettings();

      expect(BaseStore.getItem).toHaveBeenCalledWith("notificationSettings");
      // Stored values win over defaults (new_pruefpunkt default is true here).
      expect(result).toEqual(settings);
    });

    it("merges defaults for settings missing newly added keys", async () => {
      // Stored settings predate new_pruefpunkt (older app version).
      const stored = {
        new_post: { value: false, name: "Neuer Artikel" },
        new_fact_check: { value: false, name: "Neuer Faktencheck" },
      };
      jest
        .spyOn(BaseStore, "getItem")
        .mockResolvedValue(JSON.stringify(stored));
      jest.spyOn(BaseStore, "parseJSON").mockReturnValue(stored);

      const result = await SettingsStore.getNotificationSettings();

      expect(result.new_pruefpunkt).toEqual(
        SettingsStore.defaultNotificationSettings.new_pruefpunkt,
      );
      expect(result.new_post.value).toBe(false);
    });

    it("returns defaults on error", async () => {
      jest
        .spyOn(BaseStore, "getItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await SettingsStore.getNotificationSettings();

      expect(result).toEqual(SettingsStore.defaultNotificationSettings);
      consoleSpy.mockRestore();
    });
  });

  describe("setNotificationSettings", () => {
    it("persists notification settings as JSON", async () => {
      const settings = SettingsStore.defaultNotificationSettings;
      await SettingsStore.setNotificationSettings(settings);
      expect(BaseStore.setItem).toHaveBeenCalledWith(
        "notificationSettings",
        JSON.stringify(settings),
      );
    });

    it("handles errors gracefully", async () => {
      jest
        .spyOn(BaseStore, "setItem")
        .mockRejectedValue(new Error("Storage error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await SettingsStore.setNotificationSettings(
        SettingsStore.defaultNotificationSettings,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error saving notification settings:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});
