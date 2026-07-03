import { fireEvent, render } from "@testing-library/react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import type { AudioStatus } from "expo-audio";

import AudioPlayer from "#/components/audio/AudioPlayer";

jest.mock("expo-audio", () => ({
  useAudioPlayer: jest.fn(),
  useAudioPlayerStatus: jest.fn(),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@react-native-vector-icons/octicons/static", () => "Octicons");

jest.mock("#/components/Icons", () => ({
  PauseIcon: () => null,
  UnmuteIcon: () => null,
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { muted: "#DDD", textMuted: "#AAA" },
    dark: { muted: "#333", textMuted: "#AAA" },
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
  useCorporateColor: () => "#1B7194",
}));

const mockPlayer = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
};

const loadedStatus: Partial<AudioStatus> = {
  isLoaded: true,
  playing: false,
  currentTime: 0,
  duration: 120,
  error: null,
  didJustFinish: false,
};

const TEST_URL = "https://vvpaudio.b-cdn.net/audio/test-article.mp3";

describe("AudioPlayer — visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAudioPlayer).mockReturnValue(mockPlayer as any);
  });

  it("renders nothing while the audio is not yet loaded", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, isLoaded: false } as AudioStatus);
    const { toJSON } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when the audio file has a load error (e.g. 404)", async () => {
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      error: "404 Not Found",
    } as AudioStatus);
    const { toJSON } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(toJSON()).toBeNull();
  });

  it("renders the player once audio is loaded", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue(loadedStatus as AudioStatus);
    const { toJSON } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(toJSON()).not.toBeNull();
  });
});

describe("AudioPlayer — playback controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAudioPlayer).mockReturnValue(mockPlayer as any);
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue(loadedStatus as AudioStatus);
  });

  it("calls setAudioModeAsync with playsInSilentMode on mount", async () => {
    await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
  });

  it("calls player.play() when button is pressed while paused", async () => {
    const { getByRole } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    await fireEvent.press(getByRole("button"));
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(mockPlayer.pause).not.toHaveBeenCalled();
  });

  it("calls player.pause() when button is pressed while playing", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: true } as AudioStatus);
    const { getByRole } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    await fireEvent.press(getByRole("button"));
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it("calls seekTo(0) when the audio finishes", async () => {
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      didJustFinish: true,
    } as AudioStatus);
    await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
  });

  it("does not call seekTo(0) during normal playback", async () => {
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      currentTime: 45,
      didJustFinish: false,
    } as AudioStatus);
    await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
  });
});

describe("AudioPlayer — accessibility labels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAudioPlayer).mockReturnValue(mockPlayer as any);
  });

  it("labels the button 'Abspielen' when paused", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: false } as AudioStatus);
    const { getByRole } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(getByRole("button", { name: "Abspielen" })).toBeTruthy();
  });

  it("labels the button 'Pause' when playing", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: true } as AudioStatus);
    const { getByRole } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(getByRole("button", { name: "Pause" })).toBeTruthy();
  });
});

describe("AudioPlayer — clamping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAudioPlayer).mockReturnValue(mockPlayer as any);
  });

  it("clamps remaining time to 0 when currentTime overshoots duration", async () => {
    jest.mocked(useAudioPlayerStatus).mockReturnValue({
      ...loadedStatus,
      duration: 60,
      currentTime: 61,
    } as AudioStatus);
    const { getByText } = await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(getByText("0:00")).toBeTruthy();
  });
});

describe("AudioPlayer — remaining time display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAudioPlayer).mockReturnValue(mockPlayer as any);
  });

  it.each([
    ["1:30", 120, 30],
    ["1:05", 65, 0],
    ["0:00", 60, 60],
    ["60:00", 3661, 61],
    ["0:05", 90, 85],
  ])(
    "shows %s remaining when duration=%s and currentTime=%s",
    async (expected, duration, currentTime) => {
      jest.mocked(useAudioPlayerStatus).mockReturnValue({
        ...loadedStatus,
        duration,
        currentTime,
      } as AudioStatus);
      const { getByText } = await render(<AudioPlayer audioUrl={TEST_URL} />);
      expect(getByText(expected)).toBeTruthy();
    },
  );
});
