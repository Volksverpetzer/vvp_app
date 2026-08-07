import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Linking from "expo-linking";

import Config from "#/constants/Config";
import * as EngagementModule from "#/helpers/network/Engagement";
import * as Networking from "#/helpers/utils/networking";

const { getViews, getShares, getFavs, getLinks } = EngagementModule;

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
      parseSpy.mockReturnValue({
        path: "/article",
        hostname: "www.volksverpetzer.de",
      });
      getSpy.mockResolvedValue({ pageviews: 1234 });

      const result = await getViews("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/stats/article/?site=volksverpetzer.de",
      );
      expect(result).toBe(1234);
    });

    it("should pass the pruefpunkt site for a pruefpunkt permalink", async () => {
      parseSpy.mockReturnValue({
        path: "/article",
        hostname: "www.pruefpunkt.org",
      });
      getSpy.mockResolvedValue({ pageviews: 7 });

      await getViews("https://www.pruefpunkt.org/article");

      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/stats/article/?site=pruefpunkt.org",
      );
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

  describe("getShares", () => {
    it("should return share count for a permalink", async () => {
      parseSpy.mockReturnValue({
        path: "/article",
        hostname: "www.volksverpetzer.de",
      });
      getSpy.mockResolvedValue({ events: 42 });

      const result = await getShares("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      // The path is queried exactly as Plausible recorded it — no slash is
      // appended, or the "Share" event for this page would never match.
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/shares/article?site=volksverpetzer.de",
      );
      expect(result).toBe(42);
    });

    it("keeps the trailing slash of a WordPress permalink", async () => {
      parseSpy.mockReturnValue({
        path: "/faktencheck/slug/",
        hostname: "www.volksverpetzer.de",
      });
      getSpy.mockResolvedValue({ events: 7 });

      await getShares("https://www.volksverpetzer.de/faktencheck/slug/");

      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/shares/faktencheck/slug/?site=volksverpetzer.de",
      );
    });

    it("queries a slash-less URL without adding one", async () => {
      // Regression: podcast episode URLs have no trailing slash, so Plausible
      // records "/25-folge-24". Querying "/25-folge-24/" matched nothing and
      // the share count stayed at 0 no matter how often it was shared.
      // URL-aware mock: the site lookup parses Config.wpUrl separately, and an
      // unknown host falls back to that primary site.
      parseSpy.mockImplementation((url: string) =>
        url.includes("episode")
          ? { path: "/25-folge-24", hostname: "podcast.example.com" }
          : { path: "/", hostname: "www.volksverpetzer.de" },
      );
      getSpy.mockResolvedValue({ events: 3 });

      const result = await getShares("https://podcast.example.com/episode");

      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/shares/25-folge-24?site=volksverpetzer.de",
      );
      expect(result).toBe(3);
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
      parseSpy.mockReturnValue({
        path: "/article",
        hostname: "www.volksverpetzer.de",
      });
      getSpy.mockResolvedValue({ events: 15 });

      const result = await getFavs("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/favs/article/?site=volksverpetzer.de",
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
      parseSpy.mockReturnValue({
        path: "/article",
        hostname: "www.volksverpetzer.de",
      });
      getSpy.mockResolvedValue({ links: expectedLinks });

      const result = await getLinks("https://www.volksverpetzer.de/article");

      expect(parseSpy).toHaveBeenCalledWith(
        "https://www.volksverpetzer.de/article",
      );
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/links/article/?site=volksverpetzer.de",
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
