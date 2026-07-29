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

// `setActiveForLockScreen` is a synchronous native `Function` (not
// `AsyncFunction`) despite expo-audio's `void`-typed signature — mocking it
// as async would hide bugs tied to it actually being synchronous.
const mockPlayer = {
  id: "player-1",
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
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

  it("does not enable background playback on mount while paused", async () => {
    await render(<AudioPlayer audioUrl={TEST_URL} />);
    expect(setAudioModeAsync).not.toHaveBeenCalled();
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

  it("enables background playback and lock screen controls once status reports playing", async () => {
    const { rerender } = await render(
      <AudioPlayer audioUrl={TEST_URL} title="Titel" artworkUrl="art.jpg" />,
    );
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: true } as AudioStatus);
    await rerender(
      <AudioPlayer audioUrl={TEST_URL} title="Titel" artworkUrl="art.jpg" />,
    );

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: true,
    });
    expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ title: "Titel", artworkUrl: "art.jpg" }),
    );
  });

  it("disables background playback once status reports paused again", async () => {
    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: true } as AudioStatus);
    const { rerender } = await render(<AudioPlayer audioUrl={TEST_URL} />);

    jest
      .mocked(useAudioPlayerStatus)
      .mockReturnValue({ ...loadedStatus, playing: false } as AudioStatus);
    await rerender(<AudioPlayer audioUrl={TEST_URL} />);

    expect(setAudioModeAsync).toHaveBeenLastCalledWith({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: false,
    });
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

describe("AudioPlayer — exclusive background playback across instances", () => {
  const URL_A = "https://vvpaudio.b-cdn.net/audio/article-a.mp3";
  const URL_B = "https://vvpaudio.b-cdn.net/audio/article-b.mp3";

  const playerA = {
    id: "player-a",
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setActiveForLockScreen: jest.fn(),
  };
  const playerB = {
    id: "player-b",
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    setActiveForLockScreen: jest.fn(),
  };

  let statusA: AudioStatus;
  let statusB: AudioStatus;

  beforeEach(() => {
    jest.clearAllMocks();
    statusA = { ...loadedStatus, playing: false } as AudioStatus;
    statusB = { ...loadedStatus, playing: false } as AudioStatus;
    jest
      .mocked(useAudioPlayer)
      .mockImplementation((url) => (url === URL_A ? playerA : playerB) as any);
    jest
      .mocked(useAudioPlayerStatus)
      .mockImplementation((player: any) =>
        player === playerA ? statusA : statusB,
      );
  });

  it("pauses the currently active player when a different player starts playing", async () => {
    const { rerender } = await render(
      <>
        <AudioPlayer audioUrl={URL_A} />
        <AudioPlayer audioUrl={URL_B} />
      </>,
    );

    statusA = { ...statusA, playing: true };
    await rerender(
      <>
        <AudioPlayer audioUrl={URL_A} />
        <AudioPlayer audioUrl={URL_B} />
      </>,
    );
    expect(playerA.pause).not.toHaveBeenCalled();

    statusB = { ...statusB, playing: true };
    await rerender(
      <>
        <AudioPlayer audioUrl={URL_A} />
        <AudioPlayer audioUrl={URL_B} />
      </>,
    );

    expect(playerA.pause).toHaveBeenCalledTimes(1);
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
