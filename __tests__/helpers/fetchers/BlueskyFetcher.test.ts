import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import Config from "#/constants/Config";
import API from "#/helpers/network/ServerAPI";
import { BlueskyFetcher } from "#/screens/Home/fetchers/BlueskyFetcher";

import "#tests/mocks/commonMocks";

// Mock the BlueskyPostCard component to avoid complex dependencies
jest.mock("#/components/posts/bsky/BlueskyPostCard", () => ({
  __esModule: true,
  default: "BlueskyPostCard",
}));

describe("BlueskyFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ownPost = (id: string, createdAt: string) => ({
    post: {
      uri: `at://did/app.bsky.feed.post/${id}`,
      embed: null,
      author: { handle: Config.feeds.bsky.handle },
      record: { created_at: createdAt },
    },
    reply: null,
  });

  it("maps own top-level posts with the shared datetime format", async () => {
    jest
      .spyOn(API, "getBskyFeed")
      .mockResolvedValue([
        ownPost("1", "2026-11-01T12:00:00.000+02:00"),
      ] as any);

    const result = await BlueskyFetcher.feedFetcher();

    expect(result).toHaveLength(1);
    expect(result[0].datetime).toBe("2026-11-01T10:00:00");
    expect(result[0].shareable?.[0].url).toBe(
      `https://bsky.app/profile/${Config.feeds.bsky.handle}/post/1`,
    );
  });

  it("skips malformed items instead of dropping the whole feed", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest
      .spyOn(API, "getBskyFeed")
      .mockResolvedValue([
        { reply: null },
        { post: { uri: "at://did/app.bsky.feed.post/x", embed: null } },
        ownPost("bad-date", "kein Datum"),
        ownPost("2", "2026-11-02T10:00:00Z"),
      ] as any);

    const result = await BlueskyFetcher.feedFetcher();

    expect(result.map((p) => p.id)).toEqual(["at://did/app.bsky.feed.post/2"]);
  });

  it("should handle empty response", async () => {
    // Mock empty API response
    jest.spyOn(API, "getBskyFeed").mockResolvedValue([]);

    // Execute
    const result = await BlueskyFetcher.feedFetcher();

    // Assert
    expect(result).toEqual([]);
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    jest
      .spyOn(API, "getBskyFeed")
      .mockRejectedValue(new Error("Network error"));

    // Execute
    const result = await BlueskyFetcher.feedFetcher();

    // Assert
    expect(result).toEqual([]);
  });
});
