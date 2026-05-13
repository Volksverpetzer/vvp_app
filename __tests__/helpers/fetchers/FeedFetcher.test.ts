import { describe, expect, it, jest } from "@jest/globals";

import WordPressAPI from "#/helpers/network/WordPressAPI";
import { BlueskyFetcher } from "#/screens/Home/fetchers/BlueskyFetcher";
import { BotFetcher } from "#/screens/Home/fetchers/BotFetcher";
import defaultExport, {
  FeedFetcher,
} from "#/screens/Home/fetchers/FeedFetcher";
import { InstagramFetcher } from "#/screens/Home/fetchers/InstagramFetcher";
import { TikTokFetcher } from "#/screens/Home/fetchers/TikTokFetcher";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import { YouTubeFetcher } from "#/screens/Home/fetchers/YouTubeFetcher";

jest.mock("#/screens/Home/fetchers/WordPressFetcher", () => ({
  WordPressFetcher: {
    mapArticleToPost: jest.fn(),
    wpBaseFetcher: jest.fn(),
    createFetchers: jest.fn(() => ({
      feedFetcher: jest.fn(),
      searchFetcher: jest.fn(),
    })),
  },
}));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getPosts: jest.fn(),
    searchPosts: jest.fn(),
    getPost: jest.fn(),
    getFeatureImage: jest.fn(),
    convertLoadProps: jest.fn(),
    create: jest.fn(() => ({ getPosts: jest.fn(), searchPosts: jest.fn() })),
  },
}));

jest.mock("#/screens/Home/fetchers/InstagramFetcher", () => ({
  InstagramFetcher: { feedFetcher: jest.fn(), memeFetcher: jest.fn() },
}));

jest.mock("#/screens/Home/fetchers/BlueskyFetcher", () => ({
  BlueskyFetcher: { feedFetcher: jest.fn() },
}));

jest.mock("#/screens/Home/fetchers/YouTubeFetcher", () => ({
  YouTubeFetcher: { feedFetcher: jest.fn() },
}));

jest.mock("#/screens/Home/fetchers/TikTokFetcher", () => ({
  TikTokFetcher: { feedFetcher: jest.fn() },
}));

jest.mock("#/screens/Home/fetchers/BotFetcher", () => ({
  BotFetcher: { feedFetcher: jest.fn() },
}));

// createFetchers is called twice at module load time — capture both results.
const createFetchersMock = WordPressFetcher.createFetchers as jest.Mock;
const wpCreated = createFetchersMock.mock.results[0]?.value as {
  feedFetcher: jest.Mock;
  searchFetcher: jest.Mock;
};
const wp2Created = createFetchersMock.mock.results[1]?.value as {
  feedFetcher: jest.Mock;
  searchFetcher: jest.Mock;
};

describe("FeedFetcher", () => {
  it("should have all required fetchers defined", () => {
    expect(FeedFetcher.fetchers.wp).toBeDefined();
    expect(FeedFetcher.fetchers.wpSearch).toBeDefined();
    expect(FeedFetcher.fetchers.insta).toBeDefined();
    expect(FeedFetcher.fetchers.reddit).toBeDefined();
    expect(FeedFetcher.fetchers.yt).toBeDefined();
    expect(FeedFetcher.fetchers.tiktok).toBeDefined();
    expect(FeedFetcher.fetchers.bsky).toBeDefined();
    expect(FeedFetcher.fetchers.bot).toBeDefined();
    expect(FeedFetcher.fetchers.wp2).toBeDefined();
    expect(FeedFetcher.fetchers.wp2Search).toBeDefined();
  });

  it("should map fetchers to the correct implementations", () => {
    expect(FeedFetcher.fetchers.wp).toBe(wpCreated.feedFetcher);
    expect(FeedFetcher.fetchers.wpSearch).toBe(wpCreated.searchFetcher);
    expect(FeedFetcher.fetchers.insta).toBe(InstagramFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.reddit).toBe(InstagramFetcher.memeFetcher);
    expect(FeedFetcher.fetchers.yt).toBe(YouTubeFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.tiktok).toBe(TikTokFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.bsky).toBe(BlueskyFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.bot).toBe(BotFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.wp2).toBe(wp2Created.feedFetcher);
    expect(FeedFetcher.fetchers.wp2Search).toBe(wp2Created.searchFetcher);
  });

  it("should create wp fetchers via WordPressFetcher.createFetchers with WordPressAPI", () => {
    expect(WordPressFetcher.createFetchers).toHaveBeenCalledWith(WordPressAPI);
  });

  it("should create wp2 fetchers via WordPressFetcher.createFetchers with a wp2 API and source name", () => {
    expect(WordPressAPI.create).toHaveBeenCalledWith(
      "https://www.pruefpunkt.org",
    );
    expect(WordPressFetcher.createFetchers).toHaveBeenCalledWith(
      (WordPressAPI.create as jest.Mock).mock.results[0].value,
      "Prüfpunkt",
    );
  });

  it("should export fetchers as default export", () => {
    expect(defaultExport).toBe(FeedFetcher.fetchers);
  });
});
