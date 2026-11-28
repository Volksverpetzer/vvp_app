import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import PersonalStore from "#/helpers/Stores/PersonalStore";
import { fetchAnnouncements } from "#/helpers/network/AnnouncementsAPI";
import Feed from "#/screens/Home/components/Feed";
import FetcherUtilities from "#/screens/Home/fetchers/FetcherUtilities";
import type { Post } from "#/types";

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn() }),
  useScrollToTop: () => {},
}));
jest.mock("#/components/Icons", () => ({
  SearchIcon: () => null,
  SettingsIcon: () => null,
  WorldIcon: () => null,
}));
jest.mock("#/components/ui/UiSpinner", () => () => null);
jest.mock("#/components/ui/UiEmptyState", () => () => null);
jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, onPress, ...rest }: any) => (
    <Pressable onPress={onPress} {...rest}>
      {children}
    </Pressable>
  ));
});
jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/views/EmptyComponent", () => {
  const { View } = require("react-native");
  return jest.fn(() => <View testID="feed-empty-state" />);
});
jest.mock("#/components/posts/GenericPost", () => {
  const { View } = require("react-native");
  return jest.fn(() => <View testID="post-item" />);
});
jest.mock("#/components/posts/AnnouncementCard", () => {
  const { Text, Pressable } = require("react-native");
  return jest.fn(({ announcement, onDismiss }: any) => (
    <Pressable
      testID="announcement-card"
      accessibilityRole="button"
      onPress={() => onDismiss(announcement.id)}
    >
      <Text>{announcement.message}</Text>
    </Pressable>
  ));
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
jest.mock("#/helpers/network/AnnouncementsAPI", () => ({
  ...jest.requireActual("#/helpers/network/AnnouncementsAPI"),
  fetchAnnouncements: jest.fn(),
}));
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getDismissedAnnouncements: jest.fn(),
    dismissAnnouncement: jest.fn(),
    getCachedAnnouncements: jest.fn(),
    setCachedAnnouncements: jest.fn(),
  },
}));
jest.mock("#/screens/Home/fetchers/FetcherUtilities", () => ({
  __esModule: true,
  default: { fetchAndProcessPosts: jest.fn() },
}));

const mockFetch = FetcherUtilities.fetchAndProcessPosts as jest.Mock;
const mockGetDismissed = PersonalStore.getDismissedAnnouncements as jest.Mock;
const mockDismiss = PersonalStore.dismissAnnouncement as jest.Mock;
const mockGetCached = PersonalStore.getCachedAnnouncements as jest.Mock;
const mockSetCached = PersonalStore.setCachedAnnouncements as jest.Mock;
const mockFetchAnnouncements = fetchAnnouncements as jest.Mock;

const later = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 50));

const announcement = {
  id: "test-announcement",
  message: "Test message",
  actionLabel: "Test action",
  route: "/settings",
};

const posts: Post<unknown>[] = [
  {
    id: "1",
    component: jest.fn(() => null) as any,
    data: {},
    datetime: "2024-01-01T00:00:00Z",
    inView: false,
  },
];

describe("Feed announcements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDismissed.mockResolvedValue([]);
    mockGetCached.mockResolvedValue(undefined);
    mockFetchAnnouncements.mockResolvedValue([announcement]);
    // Posts arrive after the announcement, like a CDN file beating the
    // feeds; a card arriving later is withheld (tested below).
    mockFetch.mockImplementation(() => later(posts));
  });

  it("does not show an announcement when showAnnouncements is not set", async () => {
    const { getByTestId, queryByTestId } = await render(
      <Feed fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]} />,
    );
    await waitFor(() => expect(getByTestId("post-item")).toBeTruthy());
    expect(queryByTestId("announcement-card")).toBeNull();
  });

  it("shows the first non-dismissed announcement when showAnnouncements is set", async () => {
    const { getByTestId, getByText } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("announcement-card")).toBeTruthy());
    expect(getByText("Test message")).toBeTruthy();
  });

  it("does not show an announcement already recorded as dismissed", async () => {
    mockGetDismissed.mockResolvedValue(["test-announcement"]);
    const { getByTestId, queryByTestId } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("post-item")).toBeTruthy());
    expect(queryByTestId("announcement-card")).toBeNull();
  });

  it("hides the announcement and persists dismissal when dismissed", async () => {
    const { getByTestId, queryByTestId } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("announcement-card")).toBeTruthy());

    await fireEvent.press(getByTestId("announcement-card"));

    await waitFor(() => expect(queryByTestId("announcement-card")).toBeNull());
    expect(mockDismiss).toHaveBeenCalledWith("test-announcement");
  });

  it("still shows the empty state alongside the announcement when the feed is empty", async () => {
    mockFetch.mockImplementation(() => later([]));
    const { getByTestId } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue([]) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("announcement-card")).toBeTruthy());
    expect(getByTestId("feed-empty-state")).toBeTruthy();
  });

  it("caches the fetched list", async () => {
    const { getByTestId } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("announcement-card")).toBeTruthy());
    expect(mockSetCached).toHaveBeenCalledWith([announcement]);
  });

  it("falls back to the cached list when the fetch fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockFetchAnnouncements.mockRejectedValue(new TypeError("offline"));
    mockGetCached.mockResolvedValue([
      { ...announcement, id: "cached", message: "Cached message" },
    ]);
    const { getByText } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByText("Cached message")).toBeTruthy());
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it("replaces the cached list with the fetched one", async () => {
    mockGetCached.mockResolvedValue([
      { ...announcement, id: "cached", message: "Cached message" },
    ]);
    const { getByText, queryByText } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByText("Test message")).toBeTruthy());
    expect(queryByText("Cached message")).toBeNull();
  });

  it("skips announcements that have ended", async () => {
    mockFetchAnnouncements.mockResolvedValue([
      { ...announcement, id: "old", message: "Old", endsAt: "2000-01-01" },
      { ...announcement, id: "current", message: "Current" },
    ]);
    const { getByText, queryByText } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByText("Current")).toBeTruthy());
    expect(queryByText("Old")).toBeNull();
  });

  it("does not insert a card that arrives after the posts are on screen", async () => {
    mockFetch.mockResolvedValue(posts);
    let resolveAnnouncements!: (list: unknown) => void;
    mockFetchAnnouncements.mockReturnValue(
      new Promise((resolve) => (resolveAnnouncements = resolve)),
    );
    const { getByTestId, queryByTestId } = await render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("post-item")).toBeTruthy());

    await act(() => resolveAnnouncements([announcement]));

    expect(queryByTestId("announcement-card")).toBeNull();
    expect(mockSetCached).toHaveBeenCalledWith([announcement]);
  });
});
