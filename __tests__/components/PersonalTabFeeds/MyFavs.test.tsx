import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";

import GenericPost from "#/components/posts/GenericPost";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import MyFavs from "#/screens/PersonalTab/components/MyFavs";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA } from "#/types";

const mockUseIsFocused = jest.fn(() => true);

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
  },
}));

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockUseIsFocused(),
}));

jest.mock("#/components/Icons", () => ({
  StarIcon: jest.fn(() => null),
}));

jest.mock("#/components/animations/LoadingFallback", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/components/design/Card", () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

jest.mock("#/components/design/Space", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiText", () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

jest.mock("#/components/posts/InstaPost", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/components/posts/GenericPost", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/helpers/Stores/FavoritesStore", () => ({
  __esModule: true,
  default: {
    getAllFavorites: jest.fn(),
  },
}));

jest.mock("#/helpers/network/Engagement", () => ({
  registerViews: jest.fn(),
}));

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: {
    getInstaPost: jest.fn(),
  },
}));

jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: {
    getPost: jest.fn(),
  },
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useCorporateColor: jest.fn(() => "#1b7194"),
}));

jest.mock("#/screens/Home/fetchers/WordPressFetcher", () => ({
  WordPressFetcher: {
    mapArticleToPost: jest.fn(),
  },
}));

describe("MyFavs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true);
  });

  it("builds article and Instagram cards with canonical share URLs", async () => {
    const articleApiResponse = {
      id: 1,
      date: "2026-01-01T12:00:00Z",
      date_gmt: "2026-01-01T12:00:00Z",
      link: "https://www.volksverpetzer.de/faktencheck/example-article",
      slug: "example-article",
      title: { rendered: "Example Article" },
      yoast_head_json: { description: "Article description" },
      _links: { "wp:featuredmedia": [{ href: "https://example.com/image" }] },
      categories: [],
      authors: [],
    };
    const mappedArticlePost = {
      id: "example-article",
      component: jest.fn(),
      data: {
        article: {
          title: "Example Article",
          link: articleApiResponse.link,
        },
      },
      shareable: [{ url: articleApiResponse.link, title: "Artikel teilen" }],
      contentFavIdentifier: "example-article",
      contentType: FAV_TYPE_ARTICLE,
    };
    const instaApiResponse = {
      id: "abc123",
      timestamp: "2026-01-02T12:00:00Z",
      permalink: "https://www.instagram.com/p/abc123/",
      media_type: "IMAGE",
      media_url: "https://example.com/image.jpg",
      caption: "Example caption",
    };

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "example-article": { contentType: FAV_TYPE_ARTICLE },
      abc123: { contentType: FAV_TYPE_INSTA },
    });
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(articleApiResponse);
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      mappedArticlePost,
    );
    (API.getInstaPost as jest.Mock).mockResolvedValue(instaApiResponse);

    render(<MyFavs />);

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(2);
    });

    expect(updateBadgeState).toHaveBeenCalledWith({ personal: false });
    expect(registerViews).toHaveBeenCalledWith(
      "https://www.volksverpetzer.de/favs",
    );
    expect(WordPressAPI.getPost).toHaveBeenCalledWith("example-article");
    expect(WordPressFetcher.mapArticleToPost).toHaveBeenCalledWith(
      articleApiResponse,
      1,
    );
    expect(API.getInstaPost).toHaveBeenCalledWith("abc123");

    const genericPostCalls = (
      GenericPost as unknown as jest.Mock
    ).mock.calls.map(([properties]) => properties);

    expect(genericPostCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contentFavIdentifier: "example-article",
          contentType: FAV_TYPE_ARTICLE,
          shareable: [
            {
              title: "Artikel teilen",
              url: "https://www.volksverpetzer.de/faktencheck/example-article",
            },
          ],
          inView: true,
        }),
        expect.objectContaining({
          contentFavIdentifier: "abc123",
          contentType: FAV_TYPE_INSTA,
          shareable: [
            {
              title: "Instagram Post teilen",
              url: "https://www.instagram.com/p/abc123/",
            },
          ],
          inView: true,
        }),
      ]),
    );
  });

  it("skips a failing Instagram favorite without aborting the rest of the list", async () => {
    const articleApiResponse = {
      id: 1,
      date: "2026-01-01T12:00:00Z",
      date_gmt: "2026-01-01T12:00:00Z",
      link: "https://www.volksverpetzer.de/faktencheck/example-article",
      slug: "example-article",
      title: { rendered: "Example Article" },
      yoast_head_json: { description: "Article description" },
      _links: { "wp:featuredmedia": [{ href: "https://example.com/image" }] },
      categories: [],
      authors: [],
    };
    const mappedArticlePost = {
      id: "example-article",
      component: jest.fn(),
      data: {
        article: {
          title: "Example Article",
          link: articleApiResponse.link,
        },
      },
      shareable: [{ url: articleApiResponse.link, title: "Artikel teilen" }],
      contentFavIdentifier: "example-article",
      contentType: FAV_TYPE_ARTICLE,
    };
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "example-article": { contentType: FAV_TYPE_ARTICLE },
      brokenInsta: { contentType: FAV_TYPE_INSTA },
    });
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(articleApiResponse);
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      mappedArticlePost,
    );
    (API.getInstaPost as jest.Mock).mockRejectedValue(new Error("network"));

    render(<MyFavs />);

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(1);
    });

    const genericPostCalls = (
      GenericPost as unknown as jest.Mock
    ).mock.calls.map(([properties]) => properties);

    expect(genericPostCalls).toEqual([
      expect.objectContaining({
        contentFavIdentifier: "example-article",
        contentType: FAV_TYPE_ARTICLE,
        shareable: [
          {
            title: "Artikel teilen",
            url: "https://www.volksverpetzer.de/faktencheck/example-article",
          },
        ],
      }),
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load Instagram favorite brokenInsta:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("does not refresh favorites while the screen is unfocused", async () => {
    mockUseIsFocused.mockReturnValue(false);

    render(<MyFavs />);

    await waitFor(() => {
      expect(FavoritesStore.getAllFavorites).not.toHaveBeenCalled();
    });

    expect(updateBadgeState).not.toHaveBeenCalled();
    expect(registerViews).not.toHaveBeenCalled();
    expect(WordPressAPI.getPost).not.toHaveBeenCalled();
    expect(API.getInstaPost).not.toHaveBeenCalled();
  });

  it("discards stale results when focused toggles quickly and a newer request completes first", async () => {
    let resolveFirst: (value: Record<string, { contentType: string }>) => void;
    let resolveSecond: (value: Record<string, { contentType: string }>) => void;

    const firstRequest = new Promise<Record<string, { contentType: string }>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    const secondRequest = new Promise<Record<string, { contentType: string }>>(
      (resolve) => {
        resolveSecond = resolve;
      },
    );

    (FavoritesStore.getAllFavorites as jest.Mock)
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest);

    const { rerender } = render(<MyFavs />);

    // Trigger a second request by toggling focused off and back on
    act(() => {
      mockUseIsFocused.mockReturnValue(false);
    });
    rerender(<MyFavs />);

    act(() => {
      mockUseIsFocused.mockReturnValue(true);
    });
    rerender(<MyFavs />);

    // Resolve the second (newer) request first with one article
    act(() => {
      resolveSecond({ "newer-article": { contentType: FAV_TYPE_ARTICLE } });
    });

    const newerArticleApiResponse = {
      id: 2,
      date: "2026-01-02T12:00:00Z",
      date_gmt: "2026-01-02T12:00:00Z",
      link: "https://www.volksverpetzer.de/faktencheck/newer-article",
      slug: "newer-article",
      title: { rendered: "Newer Article" },
      yoast_head_json: { description: "Newer description" },
      _links: { "wp:featuredmedia": [{ href: "https://example.com/image2" }] },
      categories: [],
      authors: [],
    };
    const newerMappedPost = {
      id: "newer-article",
      component: jest.fn(),
      data: { article: { title: "Newer Article" } },
      shareable: [
        {
          url: newerArticleApiResponse.link,
          title: "Artikel teilen",
        },
      ],
      contentFavIdentifier: "newer-article",
      contentType: FAV_TYPE_ARTICLE,
    };
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(
      newerArticleApiResponse,
    );
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      newerMappedPost,
    );

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(1);
    });

    const callsAfterNewer = (
      GenericPost as unknown as jest.Mock
    ).mock.calls.map(([properties]) => properties);
    expect(callsAfterNewer[0]).toEqual(
      expect.objectContaining({ contentFavIdentifier: "newer-article" }),
    );

    // Now resolve the first (older/stale) request — its results must be ignored
    (GenericPost as unknown as jest.Mock).mockClear();
    act(() => {
      resolveFirst({ "stale-article": { contentType: FAV_TYPE_ARTICLE } });
    });

    // Wait a tick to give any potential stale setState a chance to fire
    await new Promise((resolve) => setTimeout(resolve, 50));

    // GenericPost must not have been re-rendered with the stale result
    expect(GenericPost).not.toHaveBeenCalledWith(
      expect.objectContaining({ contentFavIdentifier: "stale-article" }),
      expect.anything(),
    );
  });
});
