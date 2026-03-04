import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";
import { registerFav, registerViews } from "#/helpers/network/Engagement";
import * as Networking from "#/helpers/utils/networking";

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    Version: "15.0",
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  },
}));

jest.mock("expo-application", () => ({
  __esModule: true,
  nativeBuildVersion: "1.0.0",
}));

jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
}));

jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn().mockReturnValue({}),
  post: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    enableAnalytics: true,
    enableFavorites: true,
  },
}));

describe("Analytics (Plausible)", () => {
  let postSpy: ReturnType<typeof jest.spyOn>;
  let parseSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    postSpy = jest.spyOn(Networking, "post");
    parseSpy = jest.spyOn(Linking, "parse");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("registerEvent", () => {
    it("should send event data to Plausible", async () => {
      parseSpy.mockReturnValue({
        hostname: "www.volksverpetzer.de",
      });
      postSpy.mockResolvedValue({ success: true });

      const result = await registerEvent(
        "https://www.volksverpetzer.de/article",
        "test_event",
        { customProp: "value" },
      );

      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/api/event",
        expect.objectContaining({
          name: "test_event",
          url: expect.stringContaining("https://www.volksverpetzer.de/article"),
          domain: "www.volksverpetzer.de",
          props: expect.objectContaining({
            platform: Platform.OS,
            OSversion: Platform.Version,
            appVersion: Application.nativeApplicationVersion,
            appBuild: Application.nativeBuildVersion,
            customProp: "value",
          }),
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it("should include custom UTM parameters", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerEvent(
        "https://www.volksverpetzer.de/article",
        "test_event",
        {},
        "custom_campaign",
        "custom_source",
      );

      const [, , body] = postSpy.mock.calls[0];
      expect(body.url).toEqual(
        expect.stringContaining("utm_source=custom_source"),
      );
      expect(body.url).toEqual(
        expect.stringContaining("utm_campaign=custom_campaign"),
      );
    });

    it("should return early if analytics is disabled", async () => {
      const originalEnableAnalytics = Config.enableAnalytics;
      Config.enableAnalytics = false;

      const result = await registerEvent("https://example.com", "event");

      expect(postSpy).not.toHaveBeenCalled();
      expect(result).toBeUndefined();

      Config.enableAnalytics = originalEnableAnalytics;
    });

    it("should still send events when favorites are disabled", async () => {
      const originalEnableFavorites = Config.enableFavorites;
      Config.enableFavorites = false;
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      const result = await registerEvent("https://example.com", "event");

      expect(postSpy).toHaveBeenCalled();
      expect(result).toEqual({ success: true });

      Config.enableFavorites = originalEnableFavorites;
    });

    it("should handle errors", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      const error = new Error("Network error");
      postSpy.mockRejectedValue(error);

      const result = await registerEvent(
        "https://www.volksverpetzer.de/article",
        "test_event",
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(result).toBe(error);
    });
  });

  describe("wrapper methods", () => {
    it("registerViews should forward to registerEvent", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerViews("https://example.com/page");

      const [, , body] = postSpy.mock.calls[0];
      expect(body.name).toBe("pageviews");
    });

    it("registerFav should forward to registerEvent", async () => {
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      await registerFav("https://example.com/page");

      const [, , body] = postSpy.mock.calls[0];
      expect(body.name).toBe("favorite");
    });
  });
});
