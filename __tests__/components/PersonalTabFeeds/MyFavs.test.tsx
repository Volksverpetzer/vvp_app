import { act, render, waitFor } from "@testing-library/react-native";

import GenericPost from "#/components/posts/GenericPost";
import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import { registerViews } from "#/helpers/network/Engagement";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { updateBadgeState } from "#/helpers/provider/BadgeProvider";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import MyFavs from "#/screens/PersonalTab/components/MyFavs";
import { FAV_TYPE_ARTICLE, FAV_TYPE_INSTA, FAV_TYPE_PODCAST } from "#/types";

const mockUseIsFocused = jest.fn(() => true);

jest.mock("expo-router/react-navigation", () => ({
  useIsFocused: () => mockUseIsFocused(),
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    feeds: {
      wp: [{ handle: "https://www.pruefpunkt.org", enabled: true }],
    },
  },
}));
jest.mock("#/components/Icons", () => ({
  StarIcon: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiSpinner", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiCard", () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

jest.mock("#/components/ui/UiSpace", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiText", () => {
  // Wrap children in a real Text: RNTL 14's renderer rejects raw string
  // children inside a View (e.g. the empty-favorites hint), unlike v13.
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: jest.fn(({ children }) => <Text>{children}</Text>),
  };
});

jest.mock("#/components/posts/insta/InstaPostCard", () => ({
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
    removeFavorite: jest.fn(),
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
    create: jest.fn(),
  },
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#1b7194"),
}));

jest.mock("#/screens/Home/fetchers/WordPressFetcher", () => ({
  WordPressFetcher: {
    mapArticleToPost: jest.fn(),
  },
}));

// Mock PodcastFetcher so MyFavs doesn't pull in the audio player / expo-audio
// through PodcastPost during the test.
const mockMapPodcastEpisode = jest.fn((episode) => ({
  id: episode.id,
  component: jest.fn(),
  data: episode,
  contentFavIdentifier: episode.id,
  contentType: "podcast",
}));
jest.mock("#/screens/Home/fetchers/PodcastFetcher", () => ({
  mapPodcastEpisode: (episode: unknown) => mockMapPodcastEpisode(episode),
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

    await render(<MyFavs />);

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

  it("loads a secondary-feed (Prüfpunkt) favorite from its own site instead of purging it", async () => {
    const pruefpunktApiResponse = {
      id: 7,
      date: "2026-01-03T12:00:00Z",
      date_gmt: "2026-01-03T12:00:00Z",
      link: "https://www.pruefpunkt.org/faktencheck/pp-article",
      slug: "pp-article",
      title: { rendered: "Prüfpunkt Article" },
      yoast_head_json: { description: "PP description" },
      _links: { "wp:featuredmedia": [{ href: "https://example.com/image" }] },
      categories: [],
      authors: [],
    };
    const mappedPruefpunktPost = {
      id: "pp-article",
      component: jest.fn(),
      data: {
        article: {
          title: "Prüfpunkt Article",
          link: pruefpunktApiResponse.link,
        },
      },
      shareable: [{ url: pruefpunktApiResponse.link, title: "Artikel teilen" }],
      contentFavIdentifier: "pp-article",
      contentType: FAV_TYPE_ARTICLE,
    };
    const secondaryGetPost = jest.fn().mockResolvedValue(pruefpunktApiResponse);

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "pp-article": {
        contentType: FAV_TYPE_ARTICLE,
        originalUrl: "https://www.pruefpunkt.org/faktencheck/pp-article",
      },
    });
    (WordPressAPI.create as jest.Mock).mockReturnValue({
      getPost: secondaryGetPost,
    });
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      mappedPruefpunktPost,
    );

    await render(<MyFavs />);

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(1);
    });

    // Resolved via the secondary site's API, never the primary one.
    expect(WordPressAPI.create).toHaveBeenCalledWith(
      "https://www.pruefpunkt.org",
    );
    expect(secondaryGetPost).toHaveBeenCalledWith("pp-article");
    expect(WordPressAPI.getPost).not.toHaveBeenCalled();
    expect(FavoritesStore.removeFavorite).not.toHaveBeenCalled();
  });

  it("rebuilds a secondary-account (Prüfpunkt) Instagram favorite from its stored snapshot", async () => {
    const snapshot = {
      id: "18100522658117977",
      media_type: "IMAGE",
      media_url: "https://example.com/pp.jpg",
      caption: "Prüfpunkt insta caption",
      timestamp: "2026-01-04T12:00:00Z",
      permalink: "https://www.instagram.com/p/ppShortcode/",
    };

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "18100522658117977": {
        contentType: FAV_TYPE_INSTA,
        payload: snapshot,
      },
    });

    await render(<MyFavs />);

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(1);
    });

    // Rendered straight from the snapshot — no account-scoped by-id proxy call,
    // and the favorite is not purged.
    expect(API.getInstaPost).not.toHaveBeenCalled();
    expect(FavoritesStore.removeFavorite).not.toHaveBeenCalled();

    const genericPostCalls = (
      GenericPost as unknown as jest.Mock
    ).mock.calls.map(([properties]) => properties);
    expect(genericPostCalls[0]).toEqual(
      expect.objectContaining({
        contentFavIdentifier: "18100522658117977",
        contentType: FAV_TYPE_INSTA,
        shareable: [
          {
            title: "Instagram Post teilen",
            url: "https://www.instagram.com/p/ppShortcode/",
          },
        ],
      }),
    );
  });

  it("rebuilds a podcast favorite from its stored snapshot", async () => {
    const episode = {
      id: "ep-guid-1",
      title: "Folge 24",
      description: "Beschreibung",
      published_at: "2026-01-05T12:00:00Z",
      link: "https://volksverpetzer.podigee.io/25-folge-24",
      audio_url: "https://audio.example.com/ep24.mp3",
      image_url: "https://example.com/cover.png",
      duration: 3539,
    };

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "ep-guid-1": { contentType: FAV_TYPE_PODCAST, payload: episode },
    });

    await render(<MyFavs />);

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(1);
    });

    // Rebuilt from the snapshot via the shared mapper; the feed is not fetched
    // and the favorite is not purged.
    expect(mockMapPodcastEpisode).toHaveBeenCalledWith(episode);
    expect(FavoritesStore.removeFavorite).not.toHaveBeenCalled();

    const genericPostCalls = (
      GenericPost as unknown as jest.Mock
    ).mock.calls.map(([properties]) => properties);
    expect(genericPostCalls[0]).toEqual(
      expect.objectContaining({
        contentFavIdentifier: "ep-guid-1",
        contentType: FAV_TYPE_PODCAST,
      }),
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
      .mockImplementation(() => {});

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "example-article": { contentType: FAV_TYPE_ARTICLE },
      brokenInsta: { contentType: FAV_TYPE_INSTA },
    });
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(articleApiResponse);
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      mappedArticlePost,
    );
    (API.getInstaPost as jest.Mock).mockRejectedValue(new Error("network"));

    await render(<MyFavs />);

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

  it("removes a stale article from storage and excludes it from the list", async () => {
    const validArticleApiResponse = {
      id: 1,
      date: "2026-01-01T12:00:00Z",
      date_gmt: "2026-01-01T12:00:00Z",
      link: "https://www.volksverpetzer.de/faktencheck/valid-article",
      slug: "valid-article",
      title: { rendered: "Valid Article" },
      yoast_head_json: { description: "Valid description" },
      _links: { "wp:featuredmedia": [{ href: "https://example.com/image" }] },
      categories: [],
      authors: [],
    };
    const mappedValidPost = {
      id: "valid-article",
      component: jest.fn(),
      data: {
        article: { title: "Valid Article", link: validArticleApiResponse.link },
      },
      shareable: [
        { url: validArticleApiResponse.link, title: "Artikel teilen" },
      ],
      contentFavIdentifier: "valid-article",
      contentType: FAV_TYPE_ARTICLE,
    };
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "stale-article": { contentType: FAV_TYPE_ARTICLE },
      "valid-article": { contentType: FAV_TYPE_ARTICLE },
    });
    // favorites are iterated in reverse insertion order: valid-article first, stale-article second
    (WordPressAPI.getPost as jest.Mock)
      .mockResolvedValueOnce(validArticleApiResponse)
      .mockResolvedValueOnce(null);
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      mappedValidPost,
    );
    (FavoritesStore.removeFavorite as jest.Mock).mockResolvedValue(undefined);

    await render(<MyFavs />);

    await waitFor(() => {
      expect(GenericPost).toHaveBeenCalledTimes(1);
    });

    expect(FavoritesStore.removeFavorite).toHaveBeenCalledWith("stale-article");
    expect(FavoritesStore.removeFavorite).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("stale-article"),
    );
    expect(GenericPost).not.toHaveBeenCalledWith(
      expect.objectContaining({ contentFavIdentifier: "stale-article" }),
      expect.anything(),
    );

    consoleWarnSpy.mockRestore();
  });

  it("does not refresh favorites while the screen is unfocused", async () => {
    mockUseIsFocused.mockReturnValue(false);

    await render(<MyFavs />);

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

    const { rerender } = await render(<MyFavs />);

    // Trigger a second request by toggling focused off and back on
    await act(() => {
      mockUseIsFocused.mockReturnValue(false);
    });
    await rerender(<MyFavs />);

    await act(() => {
      mockUseIsFocused.mockReturnValue(true);
    });
    await rerender(<MyFavs />);

    // Wire the article mocks before resolving: RNTL 14's awaited act() flushes
    // the favorites-processing chain synchronously, so getPost/mapArticleToPost
    // must already be configured when the newer request resolves.
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

    // Resolve the second (newer) request first with one article
    await act(() => {
      resolveSecond({ "newer-article": { contentType: FAV_TYPE_ARTICLE } });
    });

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
    await act(() => {
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
