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
