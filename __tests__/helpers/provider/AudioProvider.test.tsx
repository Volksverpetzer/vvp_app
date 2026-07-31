import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import type { AudioStatus } from "expo-audio";
import { Text } from "react-native";

import { AudioProvider, useAudio } from "#/helpers/provider/AudioProvider";

jest.mock("expo-audio", () => ({
  useAudioPlayer: jest.fn(),
  useAudioPlayerStatus: jest.fn(),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { name: "Volksverpetzer" } },
}));

const mockGetAudioPosition = jest.fn().mockResolvedValue(0);
const mockSetAudioPosition = jest.fn().mockResolvedValue(undefined);
const mockClearAudioPosition = jest.fn().mockResolvedValue(undefined);
jest.mock("#/helpers/Stores/PersonalStore", () => ({
  __esModule: true,
  default: {
    getAudioPosition: (...a: unknown[]) => mockGetAudioPosition(...a),
    setAudioPosition: (...a: unknown[]) => mockSetAudioPosition(...a),
    clearAudioPosition: (...a: unknown[]) => mockClearAudioPosition(...a),
  },
}));

const mockPlayer = {
  id: "p1",
  play: jest.fn(),
  pause: jest.fn(),
  replace: jest.fn(),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setActiveForLockScreen: jest.fn(),
};

const loadedStatus: Partial<AudioStatus> = {
  isLoaded: true,
  playing: false,
  currentTime: 0,
  duration: 120,
  error: null,
  didJustFinish: false,
};

const TRACK_URL = "https://audio.example.com/ep.mp3";

const Consumer = () => {
  const audio = useAudio();
  return (
    <>
      <Text testID="state">
        {`${audio.currentUrl ?? "none"}|${audio.playing}`}
      </Text>
      <Text
        testID="play"
        onPress={() =>
          audio.playTrack({ audioUrl: TRACK_URL, resumeKey: TRACK_URL })
        }
      >
        play
      </Text>
      <Text testID="toggle" onPress={() => audio.toggle()}>
        toggle
      </Text>
    </>
  );
};

const renderProvider = () =>
  render(
    <AudioProvider>
      <Consumer />
    </AudioProvider>,
  );

describe("AudioProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAudioPosition.mockResolvedValue(0);
    jest.mocked(useAudioPlayer).mockReturnValue(mockPlayer as never);
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue(loadedStatus as AudioStatus);
  });

  it("loads a new track and starts it once loaded", async () => {
    const { getByTestId } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    expect(mockPlayer.replace).toHaveBeenCalledWith({ uri: TRACK_URL });
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalled());
    expect(getByTestId("state").props.children).toContain(TRACK_URL);
  });

  it("restores the stored position before playing", async () => {
    mockGetAudioPosition.mockResolvedValue(100);
    const { getByTestId } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => {
      expect(mockGetAudioPosition).toHaveBeenCalledWith(TRACK_URL);
      expect(mockPlayer.seekTo).toHaveBeenCalledWith(100);
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  it("ignores a stored position near the end", async () => {
    // duration 120, end margin 10 → 115 is within the margin
    mockGetAudioPosition.mockResolvedValue(115);
    const { getByTestId } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalled());
    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
  });

  it("resumes the same track without reloading it", async () => {
    const { getByTestId } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalled());
    mockPlayer.replace.mockClear();
    await fireEvent.press(getByTestId("play"));
    expect(mockPlayer.replace).not.toHaveBeenCalled();
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  });

  it("enables background playback and lock-screen controls while playing", async () => {
    const { setAudioModeAsync } = jest.requireMock("expo-audio");
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: true } as AudioStatus);
    await renderProvider();
    await waitFor(() => {
      expect(setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({ shouldPlayInBackground: true }),
      );
      expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalled();
    });
  });

  it("pauses via toggle when playing", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: true } as AudioStatus);
    const { getByTestId } = await renderProvider();
    await fireEvent.press(getByTestId("toggle"));
    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it("rewinds and clears the stored position when a track finishes", async () => {
    // The finish effect runs on the render where didJustFinish becomes true;
    // seed a track first, then render fresh with the finished status.
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, didJustFinish: true } as AudioStatus);
    const { getByTestId } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => {
      expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
      expect(mockClearAudioPosition).toHaveBeenCalledWith(TRACK_URL);
    });
  });
});
