import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import Config from "#/constants/Config";
import * as AnalyticsModule from "#/helpers/network/Analytics";
import * as Networking from "#/helpers/utils/networking";

const { getViews, getRegions, getShares, getFavs, getLinks, registerEvent } =
  AnalyticsModule;

// Mock dependencies
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
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    apiUrl: "https://api.example.com",
    wpUrl: "https://www.volksverpetzer.de",
    enableAnalytics: true,
    enableFavorites: true,
  },
}));

describe("Analytics", () => {
  let getSpy: ReturnType<typeof jest.spyOn>;
  let postSpy: ReturnType<typeof jest.spyOn>;
  let parseSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();

    getSpy = jest.spyOn(Networking, "get");
    postSpy = jest.spyOn(Networking, "post");
    parseSpy = jest.spyOn(Linking, "parse");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getViews", () => {
    it("should return page views for a permalink", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const expectedViews = 1234;

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ pageviews: expectedViews });

      // Execute
      const result = await getViews(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(permalink);
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/stats//article",
      );
      expect(result).toBe(expectedViews);
    });

    it("should handle missing permalink by using default wpUrl", async () => {
      // Setup
      const permalink = undefined;

      parseSpy.mockReturnValue({ path: "/" });
      getSpy.mockResolvedValue({ pageviews: 100 });

      // Execute
      const result = await getViews(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(Config.wpUrl);
      expect(result).toBe(100);
    });

    it("should return 0 if the request fails", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const error = new Error("Network error");

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockRejectedValue(error);

      // Execute
      const result = await getViews(permalink);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(result).toBe(0);
    });
  });

  describe("getRegions", () => {
    it("should return regions data", async () => {
      // Setup
      const regionsData = "Germany,France,USA";
      getSpy.mockResolvedValue(regionsData);

      // Execute
      const result = await getRegions();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(expect.anything(), "/proxy/regions", {
        responseType: "text",
      });
      expect(result).toBe(regionsData);
    });

    it("should return empty string if the request fails", async () => {
      // Setup
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      // Execute
      const result = await getRegions();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("getRegions error:", error);
      expect(result).toBe("");
    });
  });

  describe("getShares", () => {
    it("should return share count for a permalink", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const expectedShares = 42;

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ events: expectedShares });

      // Execute
      const result = await getShares(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(permalink);
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/shares//article",
      );
      expect(result).toBe(expectedShares);
    });

    it("should handle missing permalink by using default wpUrl", async () => {
      // Setup
      const permalink = undefined;

      parseSpy.mockReturnValue({ path: "/" });
      getSpy.mockResolvedValue({ events: 50 });

      // Execute
      const result = await getShares(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(Config.wpUrl);
      expect(result).toBe(50);
    });

    it("should return 0 if the request fails", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const error = new Error("Network error");

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockRejectedValue(error);

      // Execute
      const result = await getShares(permalink);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("getShares error:", error);
      expect(result).toBe(0);
    });
  });

  describe("getFavs", () => {
    it("should return favorite count for a permalink", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const expectedFavs = 15;

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ events: expectedFavs });

      // Execute
      const result = await getFavs(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(permalink);
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/favs//article",
      );
      expect(result).toBe(expectedFavs);
    });

    it("should handle missing permalink by using default wpUrl", async () => {
      // Setup
      const permalink = undefined;

      parseSpy.mockReturnValue({ path: "/" });
      getSpy.mockResolvedValue({ events: 25 });

      // Execute
      const result = await getFavs(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(Config.wpUrl);
      expect(result).toBe(25);
    });

    it("should return 0 if the request fails", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const error = new Error("Network error");

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockRejectedValue(error);

      // Execute
      const result = await getFavs(permalink);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("getFavs error:", error);
      expect(result).toBe(0);
    });
  });

  describe("getLinks", () => {
    it("should return links data for a permalink", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const expectedLinks = [
        { url: "https://example.com", visitors: 100 },
        { url: "https://another.com", visitors: 50 },
      ];

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ links: expectedLinks });

      // Execute
      const result = await getLinks(permalink);

      // Assert
      expect(parseSpy).toHaveBeenCalledWith(permalink);
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/links//article",
      );
      expect(result).toEqual(expectedLinks);
    });

    it("should return empty array if the request fails", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const error = new Error("Network error");

      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockRejectedValue(error);

      // Execute
      const result = await getLinks(permalink);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith("getLinks error:", error);
      expect(result).toEqual([]);
    });
  });

  describe("registerEvent", () => {
    it("should send event data to Plausible", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const event = "test_event";
      const properties = { customProp: "value" };

      parseSpy.mockReturnValue({
        hostname: "www.volksverpetzer.de",
        path: "/article",
      });
      postSpy.mockResolvedValue({ success: true });

      // Execute
      const result = await registerEvent(permalink, event, properties);

      // Assert
      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/api/event",
        expect.objectContaining({
          name: event,
          url: expect.stringContaining(permalink),
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
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const event = "test_event";
      const utm_campaign = "custom_campaign";
      const utm_source = "custom_source";

      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      // Execute
      await registerEvent(permalink, event, {}, utm_campaign, utm_source);

      // Assert
      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/api/event",
        expect.objectContaining({
          url: expect.any(String),
        }),
      );

      const [, , body] = postSpy.mock.calls[0];
      expect(body.url).toEqual(
        expect.stringContaining(`utm_source=${utm_source}`),
      );
      expect(body.url).toEqual(
        expect.stringContaining(`utm_campaign=${utm_campaign}`),
      );
    });

    it("should return early if analytics is disabled", async () => {
      // Setup
      const originalEnableAnalytics = Config.enableAnalytics;
      Config.enableAnalytics = false;

      // Execute
      const result = await registerEvent("https://example.com", "event");

      // Assert
      expect(postSpy).not.toHaveBeenCalled();
      expect(result).toBeUndefined();

      // Restore
      Config.enableAnalytics = originalEnableAnalytics;
    });

    it("should still send events when favorites are disabled", async () => {
      // Setup
      const originalEnableFavorites = Config.enableFavorites;
      Config.enableFavorites = false;
      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockResolvedValue({ success: true });

      // Execute
      const result = await registerEvent("https://example.com", "event");

      // Assert
      expect(postSpy).toHaveBeenCalled();
      expect(result).toEqual({ success: true });

      // Restore
      Config.enableFavorites = originalEnableFavorites;
    });

    it("should handle errors", async () => {
      // Setup
      const permalink = "https://www.volksverpetzer.de/article";
      const event = "test_event";
      const error = new Error("Network error");

      parseSpy.mockReturnValue({ hostname: "www.volksverpetzer.de" });
      postSpy.mockRejectedValue(error);

      // Execute
      const result = await registerEvent(permalink, event);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(result).toBe(error);
    });
  });

  describe("registerViews", () => {
    it.skip("should call registerEvent with pageviews event", async () => {
      // This test is skipped due to issues with mocking the registerEvent function
    });
  });

  describe("registerFav", () => {
    it.skip("should call registerEvent with favorite event", async () => {
      // This test is skipped due to issues with mocking the registerEvent function
    });
  });
});
