import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import FavoritesStore from "#/helpers/Stores/FavoritesStore";
import API from "#/helpers/network/ServerAPI";
import WordPressAPI from "#/helpers/network/WordPressAPI";
import { WordPressFetcher } from "#/screens/Home/fetchers/WordPressFetcher";
import MyFavs from "#/screens/PersonalTab/components/MyFavs";

jest.mock("react-native-reanimated", () => ({}));
jest.mock("react-native-worklets", () => ({}));
jest.mock("@likashefqet/react-native-image-zoom", () => ({}));
jest.mock("#/components/posts/InstaPost", () => () => null);
jest.mock("#/components/posts/ArticlePost", () => () => null);
jest.mock("#/screens/Home/fetchers/WordPressFetcher", () => ({
  WordPressFetcher: { mapArticleToPost: jest.fn() },
}));
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://www.volksverpetzer.de", enableEngagement: true },
}));
jest.mock("@react-navigation/native", () => ({
  useIsFocused: jest.fn(() => true),
}));
jest.mock("#/helpers/network/Engagement", () => ({
  registerViews: jest.fn(),
}));
jest.mock("#/helpers/Stores/FavoritesStore", () => ({
  __esModule: true,
  default: { getAllFavorites: jest.fn() },
}));
jest.mock("#/helpers/network/WordPressAPI", () => ({
  __esModule: true,
  default: { getPost: jest.fn() },
}));
jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: { getInstaPost: jest.fn() },
}));
jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));
jest.mock("#/components/animations/LoadingFallback", () => {
  const mockReact = require("react");
  const { Text: MockText } = require("react-native");
  return function MockLoadingFallback({ text }) {
    return mockReact.createElement(
      MockText,
      { testID: "loading-fallback" },
      text,
    );
  };
});
jest.mock("#/components/posts/GenericPost", () => {
  const mockReact = require("react");
  const { Text: MockText } = require("react-native");
  return function MockGenericPost({ contentFavIdentifier }) {
    return mockReact.createElement(
      MockText,
      { testID: `post-${contentFavIdentifier}` },
      contentFavIdentifier,
    );
  };
});
jest.mock("#/components/design/Space", () => () => null);
jest.mock("#/components/design/Text", () => () => null);
jest.mock("#/components/Icons", () => ({ StarIcon: () => null }));
jest.mock("#/hooks/useAppColorScheme", () => ({
  useCorporateColor: jest.fn(() => "#1b7194"),
}));

const mockArticle = {
  _links: { "wp:featuredmedia": [{ href: "https://example.com/media" }] },
  date: "2024-01-01",
  link: "https://www.volksverpetzer.de/artikel/test-article",
  description: "",
  categories: [1],
  id: 1,
  slug: "test-article",
  date_gmt: "2024-01-01T00:00:00",
  title: { rendered: "Test Article" },
  authors: [{ display_name: "Author", slug: "author" }],
};

const mockArticlePost = {
  datetime: "2024-01-01T00:00:00",
  id: "test-article",
  component: () => null,
  data: { article: { ...mockArticle, title: "Test Article" } },
  shareable: [
    {
      url: "https://www.volksverpetzer.de/artikel/test-article",
      title: "Artikel teilen",
    },
  ],
  priority: 1,
  hideShareCount: undefined,
  contentFavIdentifier: "test-article",
  contentType: "article",
  inView: false,
};

const mockInstaPost = {
  id: "insta-123",
  media_url: "https://example.com/image.jpg",
  caption: "Test caption",
  media_type: "IMAGE",
  timestamp: "2024-01-01T00:00:00",
  permalink: "https://www.instagram.com/p/insta-123",
};

describe("MyFavs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows loading state while favorites are being fetched", () => {
    let resolvePromise: (value: Record<string, never>) => void;
    const pendingPromise = new Promise<Record<string, never>>((resolve) => {
      resolvePromise = resolve;
    });
    (FavoritesStore.getAllFavorites as jest.Mock).mockReturnValue(
      pendingPromise,
    );

    const { queryByTestId } = render(<MyFavs />);

    expect(queryByTestId("loading-fallback")).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolvePromise!({});
  });

  it("renders article and instagram favorites on successful load", async () => {
    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "test-article": { contentType: "article" },
      "insta-123": { contentType: "insta" },
    });
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(mockArticle);
    (WordPressFetcher.mapArticleToPost as jest.Mock).mockReturnValue(
      mockArticlePost,
    );
    (API.getInstaPost as jest.Mock).mockResolvedValue(mockInstaPost);

    const { getByTestId, queryByTestId } = render(<MyFavs />);

    await waitFor(() => {
      expect(queryByTestId("loading-fallback")).toBeNull();
    });

    expect(getByTestId("post-test-article")).toBeTruthy();
    expect(getByTestId("post-insta-123")).toBeTruthy();
  });

  it("renders available favorites when one fetch fails", async () => {
    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "failing-article": { contentType: "article" },
      "insta-123": { contentType: "insta" },
    });
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(undefined);
    (API.getInstaPost as jest.Mock).mockResolvedValue(mockInstaPost);

    const { getByTestId, queryByTestId } = render(<MyFavs />);

    await waitFor(() => {
      expect(queryByTestId("loading-fallback")).toBeNull();
    });

    expect(queryByTestId("post-failing-article")).toBeNull();
    expect(getByTestId("post-insta-123")).toBeTruthy();
  });

  it("renders no posts and hides loading when all fetches fail", async () => {
    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({
      "article-1": { contentType: "article" },
      "article-2": { contentType: "article" },
    });
    (WordPressAPI.getPost as jest.Mock).mockResolvedValue(undefined);

    const { queryByTestId } = render(<MyFavs />);

    await waitFor(() => {
      expect(queryByTestId("loading-fallback")).toBeNull();
    });

    expect(queryByTestId("post-article-1")).toBeNull();
    expect(queryByTestId("post-article-2")).toBeNull();
  });

  it("renders empty state when there are no saved favorites", async () => {
    (FavoritesStore.getAllFavorites as jest.Mock).mockResolvedValue({});

    const { queryByTestId, queryAllByTestId } = render(<MyFavs />);

    await waitFor(() => {
      expect(queryByTestId("loading-fallback")).toBeNull();
    });

    expect(queryAllByTestId(/^post-/).length).toBe(0);
  });
});
