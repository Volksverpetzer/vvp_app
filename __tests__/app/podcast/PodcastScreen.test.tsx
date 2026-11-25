import { render, waitFor } from "@testing-library/react-native";
import type React from "react";

import PodcastScreen from "#/app/podcast/[id]";
import AudioPlayer from "#/components/audio/AudioPlayer";
import { registerPostInteraction } from "#/helpers/network/Analytics";

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

jest.mock("#/helpers/network/Analytics", () => ({
  registerPostInteraction: jest.fn(),
}));

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

  it("tracks the open once the episode is loaded", async () => {
    mockGetPodcastFeed.mockResolvedValue([episode]);
    await render(<PodcastScreen />);
    await waitFor(() =>
      expect(registerPostInteraction).toHaveBeenCalledTimes(1),
    );
    expect(registerPostInteraction).toHaveBeenCalledWith(
      episode.link,
      "podcast",
      "open",
    );
  });

  it("falls back to the audio url for the open when link is null", async () => {
    mockGetPodcastFeed.mockResolvedValue([{ ...episode, link: null }]);
    await render(<PodcastScreen />);
    await waitFor(() =>
      expect(registerPostInteraction).toHaveBeenCalledWith(
        episode.audio_url,
        "podcast",
        "open",
      ),
    );
  });

  it("navigates back when the episode is not in the feed", async () => {
    mockGetPodcastFeed.mockResolvedValue([{ ...episode, id: "other" }]);
    await render(<PodcastScreen />);
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalled());
    expect(registerPostInteraction).not.toHaveBeenCalled();
  });

  it("navigates back when the feed request fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetPodcastFeed.mockRejectedValue(new Error("network"));
    await render(<PodcastScreen />);
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalled());
  });

  describe("play tracking", () => {
    const startPlayback = async (
      props: Omit<typeof episode, "link"> & { link: string | null },
    ) => {
      mockGetPodcastFeed.mockResolvedValue([props]);
      await render(<PodcastScreen />);
      const MockAudioPlayer = jest.mocked(AudioPlayer);
      await waitFor(() => expect(MockAudioPlayer).toHaveBeenCalled());
      const { onPlay } = MockAudioPlayer.mock.lastCall[0] as {
        onPlay?: () => void;
      };
      onPlay?.();
    };

    it("records a podcast play with the episode link, like the feed card", async () => {
      await startPlayback(episode);
      expect(registerPostInteraction).toHaveBeenCalledTimes(1);
      expect(registerPostInteraction).toHaveBeenCalledWith(
        episode.link,
        "podcast",
        "play",
      );
    });

    it("falls back to the audio URL when the episode has no link", async () => {
      await startPlayback({ ...episode, link: null });
      expect(registerPostInteraction).toHaveBeenCalledWith(
        episode.audio_url,
        "podcast",
        "play",
      );
    });

    it("records nothing just by opening the episode", async () => {
      mockGetPodcastFeed.mockResolvedValue([episode]);
      await render(<PodcastScreen />);
      await waitFor(() => expect(jest.mocked(AudioPlayer)).toHaveBeenCalled());
      expect(registerPostInteraction).not.toHaveBeenCalled();
    });
  });
});
