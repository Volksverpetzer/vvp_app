import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import API from "../../../src/helpers/Networking/ServerAPI";
import { TikTokFetcher } from "../../../src/screens/Home/fetchers/TikTokFetcher";
import "../../mocks/commonMocks";

// Mock the TiktokPost component to avoid WebView dependencies
jest.mock("../../../src/components/posts/TiktokPost", () => ({
  __esModule: true,
  default: "TiktokPost",
}));

describe("TikTokFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch TikTok feed data correctly", async () => {
    // Mock API response with proper TiktokPostProperties structure
    const mockPosts = [
      {
        id: "1",
        embed_link: "https://www.tiktok.com/embed/1",
        create_time: 1672574400,
        title: "Test video 1",
        video_description: "Test description 1",
        cover_image_url: "https://example.com/cover1.jpg",
        embed_html: "<iframe></iframe>",
        height: 720,
        width: 480,
        share_url: "https://tiktok.com/video/1?param=value",
      },
      {
        id: "2",
        embed_link: "https://www.tiktok.com/embed/2",
        create_time: 1672660800,
        title: "Test video 2",
        video_description: "Test description 2",
        cover_image_url: "https://example.com/cover2.jpg",
        embed_html: "<iframe></iframe>",
        height: 720,
        width: 480,
        share_url: "https://tiktok.com/video/2?param=value",
      },
    ];
    jest.spyOn(API, "getTikTokFeed").mockResolvedValue(mockPosts);

    // Execute
    const result = await TikTokFetcher.feedFetcher();

    // Assert
    expect(API.getTikTokFeed).toHaveBeenCalled();
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("datetime");
    expect(result[0]).toHaveProperty("id");
    expect(result[0].data).toHaveProperty("embed_link");
    expect(result[0].data).toHaveProperty("title");
  });

  it("should handle empty response", async () => {
    // Mock empty API response
    jest.spyOn(API, "getTikTokFeed").mockResolvedValue([]);

    // Execute
    const result = await TikTokFetcher.feedFetcher();

    // Assert
    expect(result).toEqual([]);
  });

  it("should handle API errors gracefully", async () => {
    // Mock API error
    jest
      .spyOn(API, "getTikTokFeed")
      .mockRejectedValue(new Error("Network error"));

    // Execute
    const result = await TikTokFetcher.feedFetcher();

    // Assert
    expect(result).toEqual([]);
  });
});
