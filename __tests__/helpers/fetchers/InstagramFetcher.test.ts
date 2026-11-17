import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import API from "#/helpers/network/ServerAPI";
import { InstagramFetcher } from "#/screens/Home/fetchers/InstagramFetcher";

import "#tests/mocks/commonMocks";

// Mock the InstaPostCard component to avoid WebView dependencies
jest.mock("#/components/posts/insta/InstaPostCard", () => ({
  __esModule: true,
  default: "InstaPostCard",
}));

const item = (overrides: Record<string, unknown> = {}) => ({
  id: "1",
  media_type: "IMAGE",
  timestamp: "2026-11-01T10:00:00+0000",
  permalink: "https://www.instagram.com/p/1/",
  ...overrides,
});

describe("InstagramFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps images and carousels with the shared datetime format", async () => {
    jest
      .spyOn(API, "getInstaFeed")
      .mockResolvedValue([
        item(),
        item({ id: "2", media_type: "CAROUSEL_ALBUM" }),
        item({ id: "3", media_type: "VIDEO" }),
      ] as any);

    const result = await InstagramFetcher.createFeedFetcher("acc")();

    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
    expect(result[0].datetime).toBe("2026-11-01T10:00:00");
    expect(result[0].shareable).toEqual([
      { url: "https://www.instagram.com/p/1/", title: "Instagram Post teilen" },
    ]);
  });

  it("skips posts without a timestamp and drops non-https share links", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest
      .spyOn(API, "getInstaMemeFeed")
      .mockResolvedValue([
        item({ id: "no-time", timestamp: undefined }),
        item({ id: "http", permalink: "http://instagram.com/p/2/" }),
      ] as any);

    const result = await InstagramFetcher.memeFetcher();

    expect(result.map((p) => p.id)).toEqual(["http"]);
    expect(result[0].shareable).toBeUndefined();
  });
});
