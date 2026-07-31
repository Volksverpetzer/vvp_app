import { render, waitFor } from "@testing-library/react-native";
import React from "react";

import PodcastScreen from "#/app/podcast/[id]";

const mockRouterBack = jest.fn();
const mockGetPodcastFeed = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ id: "abc123" })),
  useRouter: jest.fn(() => ({ back: mockRouterBack })),
}));

jest.mock("#/helpers/network/ServerAPI", () => ({
  __esModule: true,
  default: {
    getPodcastFeed: (...args: unknown[]) => mockGetPodcastFeed(...args),
  },
}));

jest.mock("#/helpers/Sharing", () => ({ onShare: jest.fn() }));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
  useCorporateColor: jest.fn(() => "#1B7194"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { background: "#ffffff", textMuted: "#666" },
    dark: { background: "#000000", textMuted: "#AAA" },
  },
}));

jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));

jest.mock("expo-image", () => ({ __esModule: true, Image: () => null }));
jest.mock("#/components/audio/AudioPlayer", () => jest.fn(() => null));
jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));
jest.mock("#/components/views/Footer", () => jest.fn(() => null));
jest.mock("#/components/ui/UiSpinner", () => {
  const { Text } = jest.requireActual("react-native") as {
    Text: React.ComponentType<{ testID?: string; children?: React.ReactNode }>;
  };
  return jest.fn(({ text }: { text?: string }) => (
    <Text testID="spinner">{text}</Text>
  ));
});

const episode = {
  id: "abc123",
  title: "Folge 24: Testfolge",
  description: "Beschreibung der Folge.",
  published_at: "2026-06-26T04:00:00+00:00",
  link: "https://volksverpetzer.podigee.io/25-folge-24",
  audio_url: "https://audio.example.com/ep24.mp3",
  image_url: "https://example.com/cover.png",
  duration: 3539,
};

describe("PodcastScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a spinner while the feed is loading", async () => {
    mockGetPodcastFeed.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = await render(<PodcastScreen />);
    expect(getByTestId("spinner")).toBeTruthy();
  });

  it("renders the episode found by id", async () => {
    mockGetPodcastFeed.mockResolvedValue([episode]);
    const { getByText } = await render(<PodcastScreen />);
    await waitFor(() => {
      expect(getByText("Folge 24: Testfolge")).toBeTruthy();
      expect(getByText("Beschreibung der Folge.")).toBeTruthy();
      expect(getByText("26.6.2026 | 59 Min.")).toBeTruthy();
    });
  });

  it("navigates back when the episode is not in the feed", async () => {
    mockGetPodcastFeed.mockResolvedValue([{ ...episode, id: "other" }]);
    await render(<PodcastScreen />);
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalled());
  });

  it("navigates back when the feed request fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetPodcastFeed.mockRejectedValue(new Error("network"));
    await render(<PodcastScreen />);
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalled());
  });
});
