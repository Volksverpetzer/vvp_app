import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import API from "#/helpers/network/ServerAPI";
import { PodcastFetcher } from "#/screens/Home/fetchers/PodcastFetcher";
import type { PodcastEpisodeProperties } from "#/types";

import "#tests/mocks/commonMocks";

// Mock the PodcastPost component to avoid expo-audio dependencies
jest.mock("#/components/posts/PodcastPost", () => ({
  __esModule: true,
  default: "PodcastPost",
}));

const mockEpisode: PodcastEpisodeProperties = {
  id: "abc123",
  title: "Folge 24: Testfolge",
  description: "Beschreibung der Folge.",
  published_at: "2026-06-26T04:00:00+00:00",
  link: "https://volksverpetzer.podigee.io/25-folge-24",
  audio_url: "https://audio.example.com/ep24.mp3",
  image_url: "https://example.com/episode.png",
  duration: 3539,
};

describe("PodcastFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should map episodes to posts with normalized datetimes", async () => {
    jest.spyOn(API, "getPodcastFeed").mockResolvedValue([mockEpisode]);

    const result = await PodcastFetcher.feedFetcher();

    expect(API.getPodcastFeed).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("abc123");
    // Naive-UTC ISO shape used by the other fetchers (no trailing Z)
    expect(result[0].datetime).toBe("2026-06-26T04:00:00.000");
    expect(result[0].data).toHaveProperty("audio_url");
    expect(result[0].shareable).toEqual([
      { url: mockEpisode.link, title: "Podcast Folge teilen" },
    ]);
  });

  it("should skip episodes without audio or date", async () => {
    jest
      .spyOn(API, "getPodcastFeed")
      .mockResolvedValue([
        { ...mockEpisode, id: "no-audio", audio_url: "" },
        { ...mockEpisode, id: "no-date", published_at: null },
        mockEpisode,
      ]);

    const result = await PodcastFetcher.feedFetcher();

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("abc123");
  });

  it("should skip episodes with unparseable dates instead of throwing", async () => {
    // A throw inside the mapping would propagate past safeFetch and blank the
    // whole combined feed — garbage dates must only drop the one episode.
    jest
      .spyOn(API, "getPodcastFeed")
      .mockResolvedValue([
        { ...mockEpisode, id: "bad-date", published_at: "kein Datum" },
        mockEpisode,
      ]);

    const result = await PodcastFetcher.feedFetcher();

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("abc123");
  });

  it("should omit shareable for non-https links", async () => {
    jest.spyOn(API, "getPodcastFeed").mockResolvedValue([
      {
        ...mockEpisode,
        link: "http://insecure.example.com/ep" as never,
      },
    ]);

    const result = await PodcastFetcher.feedFetcher();

    expect(result.length).toBe(1);
    expect(result[0].shareable).toBeUndefined();
  });

  it("should handle API errors gracefully", async () => {
    jest
      .spyOn(API, "getPodcastFeed")
      .mockRejectedValue(new Error("Network error"));

    const result = await PodcastFetcher.feedFetcher();

    expect(result).toEqual([]);
  });
});
