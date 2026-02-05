import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { BlueskyFetcher } from "#/screens/Home/fetchers/BlueskyFetcher";
import { BotFetcher } from "#/screens/Home/fetchers/BotFetcher";
import defaultExport, {
  FeedFetcher,
} from "#/screens/Home/fetchers/FeedFetcher";
import { InstagramFetcher } from "#/screens/Home/fetchers/InstagramFetcher";
import { TikTokFetcher } from "#/screens/Home/fetchers/TikTokFetcher";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import { YouTubeFetcher } from "#/screens/Home/fetchers/YouTubeFetcher";

// Mock all the fetchers
jest.mock("#/screens/Home/fetchers/WordPressFetcher", () => ({
  WordPressFetcher: {
    feedFetcher: jest.fn(),
    searchFetcher: jest.fn(),
    mapArticleToPost: jest.fn(),
    wpBaseFetcher: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/InstagramFetcher", () => ({
  InstagramFetcher: {
    feedFetcher: jest.fn(),
    memeFetcher: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/BlueskyFetcher", () => ({
  BlueskyFetcher: {
    feedFetcher: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/YouTubeFetcher", () => ({
  YouTubeFetcher: {
    feedFetcher: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/TikTokFetcher", () => ({
  TikTokFetcher: {
    feedFetcher: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/BotFetcher", () => ({
  BotFetcher: {
    feedFetcher: jest.fn(),
  },
}));

describe("FeedFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have all required fetchers defined", () => {
    // Check that all expected fetchers are defined
    expect(FeedFetcher.fetchers).toBeDefined();
    expect(FeedFetcher.fetchers.wp).toBeDefined();
    expect(FeedFetcher.fetchers.wpSearch).toBeDefined();
    expect(FeedFetcher.fetchers.insta).toBeDefined();
    expect(FeedFetcher.fetchers.reddit).toBeDefined();
    expect(FeedFetcher.fetchers.yt).toBeDefined();
    expect(FeedFetcher.fetchers.tiktok).toBeDefined();
    expect(FeedFetcher.fetchers.bsky).toBeDefined();
    expect(FeedFetcher.fetchers.bot).toBeDefined();
  });

  it("should map fetchers to the correct implementations", () => {
    // Verify that each fetcher is mapped to the correct implementation
    expect(FeedFetcher.fetchers.wp).toBe(WordPressFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.wpSearch).toBe(WordPressFetcher.searchFetcher);
    expect(FeedFetcher.fetchers.insta).toBe(InstagramFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.reddit).toBe(InstagramFetcher.memeFetcher);
    expect(FeedFetcher.fetchers.yt).toBe(YouTubeFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.tiktok).toBe(TikTokFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.bsky).toBe(BlueskyFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.bot).toBe(BotFetcher.feedFetcher);
  });

  it("should export fetchers as default export", () => {
    // Verify that the default export is the fetchers object
    expect(defaultExport).toBe(FeedFetcher.fetchers);
  });
});
