import { jest } from "@jest/globals";

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: {
    getBskyFeed: jest.fn(),
    getBotFeed: jest.fn(),
    getInstaFeed: jest.fn(),
    getInstaMemeFeed: jest.fn(),
    getTikTokFeed: jest.fn(),
    getYouTubeFeed: jest.fn(),
  },
}));

jest.mock("#/screens/Home/fetchers/FetcherUtilities", () => ({
  __esModule: true,
  formatDate: jest.fn((date) => "2023-01-01"),
  getImageFromPost: jest.fn(),
  getVideoFromPost: jest.fn(),
  safeFetch: jest.fn(async (fetchFn: () => Promise<any>) => {
    try {
      return await fetchFn();
    } catch {
      return [];
    }
  }),
}));
