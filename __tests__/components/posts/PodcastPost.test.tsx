import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import PodcastPost from "#/components/posts/PodcastPost";
import type { PodcastEpisodeProperties } from "#/types";

jest.mock("@react-native-vector-icons/octicons/static", () => "Octicons");

jest.mock("expo-image", () => ({
  __esModule: true,
  Image: "Image",
}));

jest.mock("#/components/audio/AudioPlayer", () => {
  const { Text } = jest.requireActual("react-native") as {
    Text: React.ComponentType<{ testID?: string; children?: React.ReactNode }>;
  };
  const MockAudioPlayer = ({ audioUrl }: { audioUrl: string }) => (
    <Text testID="audio-player">{audioUrl}</Text>
  );
  return { __esModule: true, default: MockAudioPlayer };
});

const mockRegisterPostInteraction = jest.fn();
jest.mock("#/helpers/network/Analytics", () => ({
  __esModule: true,
  registerPostInteraction: (...args: unknown[]) =>
    mockRegisterPostInteraction(...args),
}));

const mockGetAudioPosition = jest.fn<() => Promise<number>>();
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getAudioPosition: () => mockGetAudioPosition(),
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
  useCorporateColor: () => "#1B7194",
}));

const episode: PodcastEpisodeProperties = {
  id: "abc123",
  title: "Folge 24: Testfolge",
  description: "Beschreibung der Folge.",
  published_at: "2026-06-26T04:00:00+00:00",
  link: "https://volksverpetzer.podigee.io/25-folge-24",
  audio_url: "https://audio.example.com/ep24.mp3",
  image_url: "https://example.com/episode.png",
  duration: 3539,
};

describe("PodcastPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAudioPosition.mockResolvedValue(0);
  });

  it("renders title, date and duration", async () => {
    const { getByText } = await render(<PodcastPost {...episode} />);
    expect(getByText("Folge 24: Testfolge")).toBeTruthy();
    expect(getByText("Beschreibung der Folge.")).toBeTruthy();
    expect(getByText("26.6.2026 | 59 Min.")).toBeTruthy();
  });

  it("shows at least 1 Min. for very short episodes", async () => {
    const { getByText } = await render(
      <PodcastPost {...episode} duration={20} published_at={null} />,
    );
    expect(getByText("1 Min.")).toBeTruthy();
  });

  it("omits the date/duration row when both are missing", async () => {
    const { queryByText } = await render(
      <PodcastPost {...episode} duration={null} published_at={null} />,
    );
    expect(queryByText(/Min\./)).toBeNull();
  });

  it("does not mount the audio player before the play tap", async () => {
    const { queryByTestId, getByText } = await render(
      <PodcastPost {...episode} />,
    );
    expect(queryByTestId("audio-player")).toBeNull();
    expect(getByText("Folge abspielen")).toBeTruthy();
  });

  it("mounts the audio player and tracks the interaction on play tap", async () => {
    const { getByText, getByTestId, queryByText } = await render(
      <PodcastPost {...episode} />,
    );
    await fireEvent.press(getByText("Folge abspielen"));
    expect(getByTestId("audio-player").props.children).toBe(episode.audio_url);
    expect(queryByText("Folge abspielen")).toBeNull();
    expect(mockRegisterPostInteraction).toHaveBeenCalledWith(
      episode.link,
      "podcast",
      "play",
    );
  });

  it("offers to resume when a playback position is stored", async () => {
    mockGetAudioPosition.mockResolvedValue(2592);
    const { findByText } = await render(<PodcastPost {...episode} />);
    expect(await findByText("Fortsetzen bei 43:12")).toBeTruthy();
  });

  it("shows the plain play label for positions near the start", async () => {
    mockGetAudioPosition.mockResolvedValue(5);
    const { findByText } = await render(<PodcastPost {...episode} />);
    expect(await findByText("Folge abspielen")).toBeTruthy();
  });

  it("falls back to the audio url for analytics when link is null", async () => {
    const { getByText } = await render(
      <PodcastPost {...episode} link={null} />,
    );
    await fireEvent.press(getByText("Folge abspielen"));
    expect(mockRegisterPostInteraction).toHaveBeenCalledWith(
      episode.audio_url,
      "podcast",
      "play",
    );
  });
});
