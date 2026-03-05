import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Linking from "expo-linking";

import Config from "#/constants/Config";
import * as EngagementModule from "#/helpers/network/Engagement";
import * as Networking from "#/helpers/utils/networking";

const { getViews, getRegions, getShares, getFavs, getLinks } = EngagementModule;

jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: jest.fn(),
}));

jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn().mockReturnValue({}),
  get: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    apiUrl: "https://api.example.com",
    wpUrl: "https://www.volksverpetzer.de",
  },
}));

describe("Engagement", () => {
  let getSpy: ReturnType<typeof jest.spyOn>;
  let parseSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    getSpy = jest.spyOn(Networking, "get");
    parseSpy = jest.spyOn(Linking, "parse");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getViews", () => {
    it("should return page views for a permalink", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ pageviews: 1234 });

      const result = await getViews("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/stats//article",
      );
      expect(result).toBe(1234);
    });

    it("should handle missing permalink by using default wpUrl", async () => {
      parseSpy.mockReturnValue({ path: "/" });
      getSpy.mockResolvedValue({ pageviews: 100 });

      const result = await getViews(undefined);

      expect(parseSpy).toHaveBeenCalledWith(Config.wpUrl);
      expect(result).toBe(100);
    });

    it("should return 0 if the request fails", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      const result = await getViews("https://www.volksverpetzer.de/article");

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(result).toBe(0);
    });
  });

  describe("getRegions", () => {
    it("should return regions data", async () => {
      getSpy.mockResolvedValue("Germany,France,USA");

      const result = await getRegions();

      expect(getSpy).toHaveBeenCalledWith(expect.anything(), "/proxy/regions", {
        responseType: "text",
      });
      expect(result).toBe("Germany,France,USA");
    });

    it("should return empty string if the request fails", async () => {
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      const result = await getRegions();

      expect(consoleErrorSpy).toHaveBeenCalledWith("getRegions error:", error);
      expect(result).toBe("");
    });
  });

  describe("getShares", () => {
    it("should return share count for a permalink", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ events: 42 });

      const result = await getShares("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/shares//article",
      );
      expect(result).toBe(42);
    });

    it("should handle missing permalink by using default wpUrl", async () => {
      parseSpy.mockReturnValue({ path: "/" });
      getSpy.mockResolvedValue({ events: 50 });

      const result = await getShares(undefined);

      expect(parseSpy).toHaveBeenCalledWith(Config.wpUrl);
      expect(result).toBe(50);
    });

    it("should return 0 if the request fails", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      const result = await getShares("https://www.volksverpetzer.de/article");

      expect(consoleErrorSpy).toHaveBeenCalledWith("getShares error:", error);
      expect(result).toBe(0);
    });
  });

  describe("getFavs", () => {
    it("should return favorite count for a permalink", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ events: 15 });

      const result = await getFavs("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/favs//article",
      );
      expect(result).toBe(15);
    });

    it("should handle missing permalink by using default wpUrl", async () => {
      parseSpy.mockReturnValue({ path: "/" });
      getSpy.mockResolvedValue({ events: 25 });

      const result = await getFavs(undefined);

      expect(parseSpy).toHaveBeenCalledWith(Config.wpUrl);
      expect(result).toBe(25);
    });

    it("should return 0 if the request fails", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      const result = await getFavs("https://www.volksverpetzer.de/article");

      expect(consoleErrorSpy).toHaveBeenCalledWith("getFavs error:", error);
      expect(result).toBe(0);
    });
  });

  describe("getLinks", () => {
    it("should return links data for a permalink", async () => {
      const expectedLinks = [
        { url: "https://example.com", visitors: 100 },
        { url: "https://another.com", visitors: 50 },
      ];
      parseSpy.mockReturnValue({ path: "/article" });
      getSpy.mockResolvedValue({ links: expectedLinks });

      const result = await getLinks("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/links//article",
      );
      expect(result).toEqual(expectedLinks);
    });

    it("should return empty array if the request fails", async () => {
      parseSpy.mockReturnValue({ path: "/article" });
      const error = new Error("Network error");
      getSpy.mockRejectedValue(error);

      const result = await getLinks("https://www.volksverpetzer.de/article");

      expect(consoleErrorSpy).toHaveBeenCalledWith("getLinks error:", error);
      expect(result).toEqual([]);
    });
  });
});
