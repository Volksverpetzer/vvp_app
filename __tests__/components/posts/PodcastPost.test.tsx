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

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush }),
}));

const mockPlayTrack = jest.fn();
const mockIsCurrent = jest.fn<(url: string) => boolean>();
jest.mock("#/helpers/provider/AudioProvider", () => ({
  useAudio: () => ({ isCurrent: mockIsCurrent, playTrack: mockPlayTrack }),
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
    mockIsCurrent.mockReturnValue(false);
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

  it("shows the play button (not live controls) when not the active track", async () => {
    const { queryByTestId, getByText } = await render(
      <PodcastPost {...episode} />,
    );
    expect(queryByTestId("audio-player")).toBeNull();
    expect(getByText("Folge abspielen")).toBeTruthy();
  });

  it("starts the episode and tracks the interaction on play tap", async () => {
    const { getByText } = await render(<PodcastPost {...episode} />);
    await fireEvent.press(getByText("Folge abspielen"));
    expect(mockPlayTrack).toHaveBeenCalledWith({
      audioUrl: episode.audio_url,
      title: episode.title,
      artworkUrl: episode.image_url,
      resumeKey: episode.audio_url,
    });
    expect(mockRegisterPostInteraction).toHaveBeenCalledWith(
      episode.link,
      "podcast",
      "play",
    );
  });

  it("shows live controls when this episode is the active track", async () => {
    mockIsCurrent.mockReturnValue(true);
    const { getByTestId, queryByText } = await render(
      <PodcastPost {...episode} />,
    );
    expect(getByTestId("audio-player").props.children).toBe(episode.audio_url);
    expect(queryByText("Folge abspielen")).toBeNull();
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

  it("opens the episode screen and tracks the open when the card is tapped", async () => {
    const { getByLabelText } = await render(<PodcastPost {...episode} />);
    await fireEvent.press(
      getByLabelText(`Podcast Folge öffnen: ${episode.title}`),
    );
    expect(mockPush).toHaveBeenCalledWith("/podcast/abc123");
    expect(mockRegisterPostInteraction).toHaveBeenCalledWith(
      episode.link,
      "podcast",
      "open",
    );
  });

  it("url-encodes the id when navigating", async () => {
    // Episode ids are opaque strings from the feed, so they can contain
    // characters that must not go into a route path raw. Kept in a variable
    // rather than an inline `id="..."` so HTML-oriented linters don't read it
    // as a DOM id attribute (this is a component prop, not markup).
    const episodeIdWithSpecialCharacters = "a/b c";
    const { getByLabelText } = await render(
      <PodcastPost {...episode} id={episodeIdWithSpecialCharacters} />,
    );
    await fireEvent.press(
      getByLabelText(`Podcast Folge öffnen: ${episode.title}`),
    );
    expect(mockPush).toHaveBeenCalledWith("/podcast/a%2Fb%20c");
  });
});
