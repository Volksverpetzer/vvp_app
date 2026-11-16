import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import API from "#/helpers/network/ServerAPI";
import { YouTubeFetcher } from "#/screens/Home/fetchers/YouTubeFetcher";

import "#tests/mocks/commonMocks";

// Mock the YouTubePost component to avoid WebView dependencies
jest.mock("#/components/posts/YouTubePost", () => ({
  __esModule: true,
  default: "YouTubePost",
}));

describe("YouTubeFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps videos to posts with a share link", async () => {
    jest
      .spyOn(API, "getYouTubeFeed")
      .mockResolvedValue([
        { id: "abc", snippet: { publishedAt: "2026-11-01T10:00:00Z" } },
      ] as any);

    const result = await YouTubeFetcher.feedFetcher();

    expect(result).toHaveLength(1);
    expect(result[0].datetime).toBe("2026-11-01T10:00:00");
    expect(result[0].shareable).toEqual([
      {
        url: "https://www.youtube.com/watch/abc",
        title: "YouTube Video teilen",
      },
    ]);
  });

  it("skips items without a snippet instead of throwing", async () => {
    jest
      .spyOn(API, "getYouTubeFeed")
      .mockResolvedValue([
        { id: "broken" },
        { id: "ok", snippet: { publishedAt: "2026-11-01T10:00:00Z" } },
      ] as any);

    const result = await YouTubeFetcher.feedFetcher();

    expect(result.map((p) => p.id)).toEqual(["ok"]);
  });
});
