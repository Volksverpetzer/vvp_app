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
  // Native state of the item the player currently holds (read synchronously).
  isLoaded: true,
  duration: 120,
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
const OTHER_URL = "https://audio.example.com/other.mp3";

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
      <Text
        testID="play-other"
        onPress={() =>
          audio.playTrack({ audioUrl: OTHER_URL, resumeKey: OTHER_URL })
        }
      >
        play other
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
    mockPlayer.isLoaded = true;
    mockPlayer.duration = 120;
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

  it("restores the next track's position against its own duration, not the previous track's", async () => {
    // Track A: 600 s long, nothing stored.
    mockPlayer.duration = 600;
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, duration: 600 } as AudioStatus);
    const { getByTestId, rerender } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalled());
    jest.clearAllMocks();

    // Switch to B (stored at 1200 s). The status hook still reports A until
    // B's load event arrives; the player itself is already loading B.
    mockGetAudioPosition.mockResolvedValue(1200);
    mockPlayer.isLoaded = false;
    mockPlayer.duration = 0;
    await fireEvent.press(getByTestId("play-other"));
    expect(mockPlayer.replace).toHaveBeenCalledWith({ uri: OTHER_URL });
    expect(mockGetAudioPosition).not.toHaveBeenCalled();
    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
    expect(mockPlayer.play).not.toHaveBeenCalled();

    // B finishes loading: 3600 s long.
    mockPlayer.isLoaded = true;
    mockPlayer.duration = 3600;
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, duration: 3600 } as AudioStatus);
    await rerender(
      <AudioProvider>
        <Consumer />
      </AudioProvider>,
    );
    await waitFor(() => {
      expect(mockGetAudioPosition).toHaveBeenCalledWith(OTHER_URL);
      expect(mockPlayer.seekTo).toHaveBeenCalledWith(1200);
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  it("does not save the previous track's position under the next track's key", async () => {
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      playing: true,
      currentTime: 300,
    } as AudioStatus);
    const { getByTestId, rerender } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalled());
    // A status tick after A's restore settled saves A's position.
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      playing: true,
      currentTime: 310,
    } as AudioStatus);
    await rerender(
      <AudioProvider>
        <Consumer />
      </AudioProvider>,
    );
    await waitFor(() =>
      expect(mockSetAudioPosition).toHaveBeenCalledWith(TRACK_URL, 310),
    );

    mockPlayer.isLoaded = false;
    await fireEvent.press(getByTestId("play-other"));
    expect(mockSetAudioPosition).not.toHaveBeenCalledWith(
      OTHER_URL,
      expect.anything(),
    );
  });

  it("does not save the previous track's position while the next track's restore is pending, even if it loaded at once", async () => {
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      playing: true,
      currentTime: 300,
    } as AudioStatus);
    const { getByTestId, rerender } = await renderProvider();
    await fireEvent.press(getByTestId("play"));
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalled());
    // A status tick after A's restore settled saves A's position.
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      playing: true,
      currentTime: 310,
    } as AudioStatus);
    await rerender(
      <AudioProvider>
        <Consumer />
      </AudioProvider>,
    );
    await waitFor(() =>
      expect(mockSetAudioPosition).toHaveBeenCalledWith(TRACK_URL, 310),
    );

    // B is ready right after replace() (player.isLoaded stays true) while the
    // status hook still reports A playing at 300 s; B's restore is pending.
    let resolvePosition: (value: number) => void = () => {};
    mockGetAudioPosition.mockReturnValue(
      new Promise<number>((resolve) => {
        resolvePosition = resolve;
      }),
    );
    await fireEvent.press(getByTestId("play-other"));
    expect(mockGetAudioPosition).toHaveBeenCalledWith(OTHER_URL);
    expect(mockSetAudioPosition).not.toHaveBeenCalledWith(
      OTHER_URL,
      expect.anything(),
    );

    resolvePosition(0);
    await waitFor(() => expect(mockPlayer.play).toHaveBeenCalledTimes(2));
    expect(mockSetAudioPosition).not.toHaveBeenCalledWith(
      OTHER_URL,
      expect.anything(),
    );
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
