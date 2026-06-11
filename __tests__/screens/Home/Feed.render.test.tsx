import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import Feed from "#/screens/Home/components/Feed";
import FetcherUtilities from "#/screens/Home/fetchers/FetcherUtilities";
import type { Post } from "#/types";

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn() }),
  useScrollToTop: () => undefined,
}));
jest.mock("#/components/Icons", () => ({
  SearchIcon: () => null,
  SettingsIcon: () => null,
  WorldIcon: () => null,
}));
jest.mock("#/components/ui/UiSpinner", () => () => null);
jest.mock("#/components/ui/UiEmptyState", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => (
    <Text testID="empty-state">{children}</Text>
  ));
});
jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, onPress }: any) => (
    <Pressable onPress={onPress}>{children}</Pressable>
  ));
});
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/views/EmptyComponent", () => () => null);
jest.mock("#/components/posts/GenericPost", () => {
  const { View } = require("react-native");
  return jest.fn(() => <View testID="post-item" />);
});
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: { light: { primary: "#000" }, dark: { primary: "#fff" } },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { centered: {}, content: {}, row: {} },
}));
jest.mock("#/screens/Home/fetchers/FetcherUtilities", () => ({
  __esModule: true,
  default: { fetchAndProcessPosts: jest.fn() },
}));

const mockFetch = FetcherUtilities.fetchAndProcessPosts as jest.Mock;

describe("Feed rendering", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows empty state when fetchers array is empty", async () => {
    const { getByTestId } = render(<Feed fetchers={[]} />);
    await waitFor(() => expect(getByTestId("empty-state")).toBeTruthy());
  });

  it("renders posts after fetch resolves", async () => {
    const posts: Post<unknown>[] = [
      {
        id: "1",
        component: jest.fn(() => null) as any,
        data: {},
        datetime: "2024-01-01T00:00:00Z",
        inView: false,
        shareable: [],
        contentFavIdentifier: "post-1",
        contentType: "article",
      },
    ];
    mockFetch.mockResolvedValueOnce(posts);

    const fetcher = jest.fn().mockResolvedValue(posts);
    const { getByTestId } = render(<Feed fetchers={[{ fetcher }]} />);

    await waitFor(() => expect(getByTestId("post-item")).toBeTruthy());
  });

  it("renders a FlatList after fetch completes", async () => {
    const posts: Post<unknown>[] = [
      {
        id: "1",
        component: jest.fn(() => null) as any,
        data: {},
        datetime: "2024-01-01T00:00:00Z",
        inView: false,
        shareable: [],
        contentFavIdentifier: "post-1",
        contentType: "article",
      },
      {
        id: "2",
        component: jest.fn(() => null) as any,
        data: {},
        datetime: "2024-01-01T00:00:00Z",
        inView: false,
        shareable: [],
        contentFavIdentifier: "post-2",
        contentType: "article",
      },
    ];
    mockFetch.mockResolvedValueOnce(posts);

    const fetcher = jest.fn().mockResolvedValue(posts);
    const { getAllByTestId } = render(<Feed fetchers={[{ fetcher }]} />);

    await waitFor(() => expect(getAllByTestId("post-item")).toHaveLength(2));
  });
});
