import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import PersonalStore from "#/helpers/Stores/PersonalStore";
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
jest.mock("#/components/posts/AnnouncementCard", () => {
  const { Text, Pressable } = require("react-native");
  return jest.fn(({ announcement, onDismiss }: any) => (
    <Pressable
      testID="announcement-card"
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
jest.mock("#/constants/Announcements", () => ({
  __esModule: true,
  default: [{ id: "test-announcement", message: "Test message" }],
}));
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getDismissedAnnouncements: jest.fn(),
    dismissAnnouncement: jest.fn(),
  },
}));
jest.mock("#/screens/Home/fetchers/FetcherUtilities", () => ({
  __esModule: true,
  default: { fetchAndProcessPosts: jest.fn() },
}));

const mockFetch = FetcherUtilities.fetchAndProcessPosts as jest.Mock;
const mockGetDismissed = PersonalStore.getDismissedAnnouncements as jest.Mock;
const mockDismiss = PersonalStore.dismissAnnouncement as jest.Mock;

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
    mockFetch.mockResolvedValue(posts);
  });

  it("does not show an announcement when showAnnouncements is not set", async () => {
    const { getByTestId, queryByTestId } = render(
      <Feed fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]} />,
    );
    await waitFor(() => expect(getByTestId("post-item")).toBeTruthy());
    expect(queryByTestId("announcement-card")).toBeNull();
  });

  it("shows the first non-dismissed announcement when showAnnouncements is set", async () => {
    const { getByTestId, getByText } = render(
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
    const { getByTestId, queryByTestId } = render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("post-item")).toBeTruthy());
    expect(queryByTestId("announcement-card")).toBeNull();
  });

  it("hides the announcement and persists dismissal when dismissed", async () => {
    const { getByTestId, queryByTestId } = render(
      <Feed
        showAnnouncements
        fetchers={[{ fetcher: jest.fn().mockResolvedValue(posts) }]}
      />,
    );
    await waitFor(() => expect(getByTestId("announcement-card")).toBeTruthy());

    fireEvent.press(getByTestId("announcement-card"));

    await waitFor(() => expect(queryByTestId("announcement-card")).toBeNull());
    expect(mockDismiss).toHaveBeenCalledWith("test-announcement");
  });
});
