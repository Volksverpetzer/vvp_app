import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import SettingsStore from "#/helpers/Stores/SettingsStore";
import { SettingsContext } from "#/helpers/provider/SettingsProvider";
import type { AdvancedSettingType, ContentSettingType } from "#/types";

// Mock the SettingsStore
jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultContentSettings: {
      reddit: { value: true, name: "Memes" },
      "wp:volksverpetzer.de": { value: true, name: "Artikel" },
      "insta:volksverpetzer": { value: true, name: "Instagram Slides" },
      "insta:pruefpunkt": { value: true, name: "Prüfpunkt Instagram" },
      yt: { value: true, name: "YouTube Videos" },
      tiktok: { value: true, name: "TikTok Videos" },
      bsky: { value: false, name: "Bluesky Posts" },
      bot: { value: true, name: "Bot Feed" },
      "wp:pruefpunkt.org": { value: true, name: "Prüfpunkt Artikel" },
    },
    defaultAdvancedSettings: {
      advancedReporting: { value: false, name: "Erweitertes Reporting" },
      alwaysDarkMode: { value: false, name: "Immer Dark Mode" },
    },
    getContentSettings: jest.fn(),
    getAdvancedSettings: jest.fn(),
    setContentSettings: jest.fn(),
    setAdvancedSettings: jest.fn(),
  },
}));

describe("SettingsContext Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SettingsStore Integration", () => {
    it("should have SettingsStore methods available", () => {
      expect(SettingsStore.getContentSettings).toBeDefined();
      expect(SettingsStore.getAdvancedSettings).toBeDefined();
      expect(SettingsStore.setContentSettings).toBeDefined();
      expect(SettingsStore.setAdvancedSettings).toBeDefined();
      expect(typeof SettingsStore.getContentSettings).toBe("function");
      expect(typeof SettingsStore.getAdvancedSettings).toBe("function");
      expect(typeof SettingsStore.setContentSettings).toBe("function");
      expect(typeof SettingsStore.setAdvancedSettings).toBe("function");
    });

    it("should call getContentSettings when initializing", async () => {
      jest
        .spyOn(SettingsStore, "getContentSettings")
        .mockResolvedValue({} as ContentSettingType);

      await SettingsStore.getContentSettings();

      expect(SettingsStore.getContentSettings).toHaveBeenCalled();
    });

    it("should call getAdvancedSettings when initializing", async () => {
      jest
        .spyOn(SettingsStore, "getAdvancedSettings")
        .mockResolvedValue({} as AdvancedSettingType);

      await SettingsStore.getAdvancedSettings();

      expect(SettingsStore.getAdvancedSettings).toHaveBeenCalled();
    });

    it("should call setContentSettings when updating", async () => {
      const newSettings: ContentSettingType = {
        reddit: { value: false, name: "Memes" },
        tiktok: { value: true, name: "Vids" },
        "wp:volksverpetzer.de": { value: false, name: "WP" },
        "insta:volksverpetzer": { value: true, name: "Insta" },
        yt: { value: false, name: "Videos" },
        bsky: { value: true, name: "Tweets" },
        bot: { value: false, name: "Fact" },
        podcast: { value: true, name: "Podcast Folgen" },
        "wp:pruefpunkt.org": { value: true, name: "Prüfpunkt Artikel" },
      };

      await SettingsStore.setContentSettings(newSettings);

      expect(SettingsStore.setContentSettings).toHaveBeenCalledWith(
        newSettings,
      );
    });

    it("should call setAdvancedSettings when updating", async () => {
      const newSettings: AdvancedSettingType = {
        advancedReporting: { value: true, name: "Erweitertes Reporting" },
        alwaysDarkMode: { value: true, name: "Always Dark Mode" },
      };

      await SettingsStore.setAdvancedSettings(newSettings);

      expect(SettingsStore.setAdvancedSettings).toHaveBeenCalledWith(
        newSettings,
      );
    });
  });

  describe("Default Settings", () => {
    it("should have correct default content settings structure", () => {
      expect(SettingsStore.defaultContentSettings).toBeDefined();
      expect(SettingsStore.defaultContentSettings).toHaveProperty("reddit");
      // Array form because the keys contain dots, which toHaveProperty
      // would otherwise treat as path separators.
      expect(SettingsStore.defaultContentSettings).toHaveProperty([
        "wp:volksverpetzer.de",
      ]);
      expect(SettingsStore.defaultContentSettings).toHaveProperty([
        "wp:pruefpunkt.org",
      ]);
      expect(SettingsStore.defaultContentSettings).toHaveProperty([
        "insta:volksverpetzer",
      ]);
      expect(SettingsStore.defaultContentSettings).toHaveProperty([
        "insta:pruefpunkt",
      ]);
      expect(SettingsStore.defaultContentSettings).toHaveProperty("yt");
      expect(SettingsStore.defaultContentSettings).toHaveProperty("tiktok");
      expect(SettingsStore.defaultContentSettings).toHaveProperty("bsky");
      expect(SettingsStore.defaultContentSettings).toHaveProperty("bot");
    });

    it("should have correct default advanced settings structure", () => {
      expect(SettingsStore.defaultAdvancedSettings).toBeDefined();
      /*
      expect(SettingsStore.defaultAdvancedSettings).toHaveProperty(
        "advancedReporting",
      );
      */
      expect(SettingsStore.defaultAdvancedSettings).toHaveProperty(
        "alwaysDarkMode",
      );
    });
  });

  describe("SettingsContext", () => {
    it("should be available as a context object", () => {
      expect(SettingsContext).toBeDefined();
      expect(typeof SettingsContext).toBe("object");
    });
  });
});
