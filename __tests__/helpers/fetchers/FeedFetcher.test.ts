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
  InstagramFetcher: {
    createFeedFetcher: jest.fn(() => jest.fn()),
    memeFetcher: jest.fn(),
  },
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

// createFetchers is called once per configured wp feed at module load time —
// capture both results (primary site first, Prüfpunkt second).
const createFetchersMock = WordPressFetcher.createFetchers as jest.Mock;
const wpCreated = createFetchersMock.mock.results[0]?.value as {
  feedFetcher: jest.Mock;
  searchFetcher: jest.Mock;
};
const pruefpunktCreated = createFetchersMock.mock.results[1]?.value as {
  feedFetcher: jest.Mock;
  searchFetcher: jest.Mock;
};

describe("FeedFetcher", () => {
  it("should have all required fetchers defined", () => {
    expect(FeedFetcher.fetchers["wp:volksverpetzer.de"]).toBeDefined();
    expect(FeedFetcher.fetchers["wp:volksverpetzer.de:search"]).toBeDefined();
    expect(FeedFetcher.fetchers["insta:volksverpetzer"]).toBeDefined();
    expect(FeedFetcher.fetchers["insta:pruefpunkt"]).toBeDefined();
    expect(FeedFetcher.fetchers.reddit).toBeDefined();
    expect(FeedFetcher.fetchers.yt).toBeDefined();
    expect(FeedFetcher.fetchers.tiktok).toBeDefined();
    expect(FeedFetcher.fetchers.bsky).toBeDefined();
    expect(FeedFetcher.fetchers.bot).toBeDefined();
    expect(FeedFetcher.fetchers["wp:pruefpunkt.org"]).toBeDefined();
    expect(FeedFetcher.fetchers["wp:pruefpunkt.org:search"]).toBeDefined();
  });

  it("should map fetchers to the correct implementations", () => {
    expect(FeedFetcher.fetchers["wp:volksverpetzer.de"]).toBe(
      wpCreated.feedFetcher,
    );
    expect(FeedFetcher.fetchers["wp:volksverpetzer.de:search"]).toBe(
      wpCreated.searchFetcher,
    );
    const createFeedFetcherMock =
      InstagramFetcher.createFeedFetcher as jest.Mock;
    expect(FeedFetcher.fetchers["insta:volksverpetzer"]).toBe(
      createFeedFetcherMock.mock.results[0]?.value,
    );
    expect(FeedFetcher.fetchers["insta:pruefpunkt"]).toBe(
      createFeedFetcherMock.mock.results[1]?.value,
    );
    expect(FeedFetcher.fetchers.reddit).toBe(InstagramFetcher.memeFetcher);
    expect(FeedFetcher.fetchers.yt).toBe(YouTubeFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.tiktok).toBe(TikTokFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.bsky).toBe(BlueskyFetcher.feedFetcher);
    expect(FeedFetcher.fetchers.bot).toBe(BotFetcher.feedFetcher);
    expect(FeedFetcher.fetchers["wp:pruefpunkt.org"]).toBe(
      pruefpunktCreated.feedFetcher,
    );
    expect(FeedFetcher.fetchers["wp:pruefpunkt.org:search"]).toBe(
      pruefpunktCreated.searchFetcher,
    );
  });

  it("should create an API per configured wp feed", () => {
    expect(WordPressAPI.create).toHaveBeenCalledWith(
      "https://www.volksverpetzer.de",
    );
    expect(WordPressAPI.create).toHaveBeenCalledWith(
      "https://www.pruefpunkt.org",
    );
  });

  it("should create the primary wp fetchers without a source name", () => {
    expect(WordPressFetcher.createFetchers).toHaveBeenCalledWith(
      (WordPressAPI.create as jest.Mock).mock.results[0].value,
      undefined,
    );
  });

  it("should create the Prüfpunkt fetchers with its source name", () => {
    expect(WordPressFetcher.createFetchers).toHaveBeenCalledWith(
      (WordPressAPI.create as jest.Mock).mock.results[1].value,
      "Prüfpunkt",
    );
  });

  it("should create an Instagram fetcher per configured account", () => {
    expect(InstagramFetcher.createFeedFetcher).toHaveBeenCalledWith(
      "volksverpetzer",
    );
    expect(InstagramFetcher.createFeedFetcher).toHaveBeenCalledWith(
      "pruefpunkt",
    );
  });

  it("should export fetchers as default export", () => {
    expect(defaultExport).toBe(FeedFetcher.fetchers);
  });
});
