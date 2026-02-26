import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import API from "#/helpers/network/ServerAPI";
import * as Networking from "#/helpers/utils/networking";

// Mock dependencies
jest.mock("#/helpers/utils/networking", () => ({
  __esModule: true,
  createClient: jest.fn(() => ({
    defaults: {
      baseURL: "http://api.example.com",
      headers: {},
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    apiUrl: "http://api.example.com",
  },
}));

describe("ServerAPI", () => {
  let getSpy: ReturnType<typeof jest.spyOn>;
  let postSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    getSpy = jest.spyOn(Networking, "get");
    postSpy = jest.spyOn(Networking, "post");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("get", () => {
    it("should call Networking.get with correct parameters", async () => {
      // Setup
      const path = "/test";
      const abortTime = 5000;
      const responseData = { success: true };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.get(path, abortTime);

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        path,
        undefined,
        abortTime,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("post", () => {
    it("should call Networking.post with correct parameters", async () => {
      // Setup
      const path = "/test";
      const data = { name: "test" };
      const abortTime = 5000;
      const responseData = { id: 123 };
      postSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.post(path, data, abortTime);

      // Assert
      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        path,
        data,
        abortTime,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("getInstaPost", () => {
    it("should call get with correct path and post ID", async () => {
      // Setup
      const postId = "12345";
      const responseData = {
        id: postId,
        media_url: "https://example.com/image.jpg",
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getInstaPost(postId);

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/instaById/12345",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("getInstaMemeFeed", () => {
    it("should call get with correct path", async () => {
      // Setup
      const responseData = {
        data: [{ id: "meme1", media_url: "https://example.com/meme.jpg" }],
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getInstaMemeFeed();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/instaMemeFeed",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.data);
    });
  });

  describe("getReportStatus", () => {
    it("should call get with correct path and UUID", async () => {
      // Setup
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const responseData = { id: uuid, status: "pending" };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getReportStatus(uuid);

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/statusFake/123e4567-e89b-12d3-a456-426614174000",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("getInstaFeed", () => {
    it("should call get with correct path", async () => {
      // Setup
      const responseData = {
        data: [{ id: "insta1", media_url: "https://example.com/image.jpg" }],
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getInstaFeed();

      // Assert
      expect(Networking.get).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/instaFeed",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.data);
    });
  });

  describe("getYouTubeFeed", () => {
    it("should call get with correct path", async () => {
      // Setup
      const responseData = {
        items: [{ id: "yt1", snippet: { title: "Test Video" } }],
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getYouTubeFeed();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/ytAPI",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.items);
    });
  });

  describe("getFactFeed", () => {
    it("should call get with keywords joined by comma", async () => {
      // Setup
      const keywords = ["covid", "vaccine"];
      const responseData = {
        claims: [{ text: "Test claim", claimant: "Test source" }],
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getFactFeed(keywords);

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/googleFact?keywords=covid,vaccine",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.claims);
    });
  });

  describe("getMastodonFeed", () => {
    it("should call get with correct path and return data", async () => {
      // Setup
      const responseData = { data: [{ id: 1, content: "Test toot" }] };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getMastodonFeed();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/mastodon",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.data);
    });
  });

  describe("getBskyFeed", () => {
    it("should call get with correct path and return feed", async () => {
      // Setup
      const responseData = {
        feed: [{ uri: "at://test", post: { text: "Test post" } }],
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getBskyFeed();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/proxy/blueskyFeed",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.feed);
    });
  });

  describe("getBotFeed", () => {
    it("should call get with correct path and return feed", async () => {
      // Setup
      const responseData = {
        feed: [{ uri: "at://test", post: { text: "Test post" } }],
      };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getBotFeed();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/botFeed",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.feed);
    });
  });

  describe("getTikTokFeed", () => {
    it("should call get with correct path and extract videos from response", async () => {
      // Setup
      const videos = [{ id: "tt1", title: "Test TikTok" }];
      const responseData = { data: { data: { videos } } };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getTikTokFeed();

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/tiktok/tiktokFeed",
        undefined,
        undefined,
      );
      expect(result).toEqual(videos);
    });
  });

  describe("registerNotifications", () => {
    it("should call post with correct path and body", async () => {
      // Setup
      const body = {
        expo_token: "ExponentPushToken[xxx]",
        settings: {
          new_post: { value: true, name: "New Posts" },
          new_fact_check: { value: true, name: "Fact Checks" },
        },
        os: "ios",
        version: "1.0.0",
      };
      const responseData = { status: "success" };
      postSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.registerNotifications(body);

      // Assert
      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/register",
        body,
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("paymentIntent", () => {
    it("should call get with amount parameter", async () => {
      // Setup
      const amount = 500;
      const responseData = { client_secret: "secret_key" };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.paymentIntent(amount);

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/paymentIntent?amount=500",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("reportFake", () => {
    it("should call post with report data", async () => {
      // Setup
      const report = {
        description: "Fake news",
        more_info: "Additional details",
        url: "https://example.com/fake",
        allowed_public: true,
      };
      const responseData = { id: "report123" };
      postSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.reportFake(report);

      // Assert
      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/reportFake",
        report,
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("getRecommendations", () => {
    it("should call get with slug parameter", async () => {
      // Setup
      const slug = "test-article";
      const responseData = { matches: ["related-1", "related-2"] };
      getSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.getRecommendations(slug);

      // Assert
      expect(getSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/recommend?slug=test-article",
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("postAISearch", () => {
    it("should call post with query and n_results parameters", async () => {
      // Setup
      const body = { query: "climate change" };
      const expectedPostData = { query: "climate change", n_results: 20 };
      const responseData = {
        results: [{ url: "https://example.com", text: "Result text" }],
      };
      postSpy.mockResolvedValue(responseData);

      // Execute
      const result = await API.postAISearch(body);

      // Assert
      expect(postSpy).toHaveBeenCalledWith(
        expect.anything(),
        "/ai_search",
        expectedPostData,
        undefined,
        undefined,
      );
      expect(result).toEqual(responseData.results);
    });
  });
});
