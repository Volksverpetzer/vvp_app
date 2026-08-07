import { fireEvent, render } from "@testing-library/react-native";

import AudioPlayer from "#/components/audio/AudioPlayer";

jest.mock("@react-native-vector-icons/octicons/static", () => "Octicons");

jest.mock("#/components/Icons", () => ({ PauseIcon: () => null }));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { textMuted: "#AAA", surfaceDisabled: "#DDD", error: "#C62828" },
    dark: { textMuted: "#AAA", surfaceDisabled: "#333", error: "#EF5350" },
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
  useCorporateColor: () => "#1B7194",
}));

jest.mock("#/components/ui/UiSpinner", () => {
  const { Text } = jest.requireActual("react-native") as {
    Text: React.ComponentType<{ testID?: string }>;
  };
  return jest.fn(() => <Text testID="spinner" />);
});

const audioState = {
  currentUrl: null as string | null,
  isLoaded: false,
  playing: false,
  currentTime: 0,
  duration: 0,
  error: false,
};
const mockPlayTrack = jest.fn();
const mockToggle = jest.fn();
const mockSeekTo = jest.fn();
const mockIsCurrent = jest.fn();

jest.mock("#/helpers/provider/AudioProvider", () => ({
  useAudio: () => ({
    currentUrl: audioState.currentUrl,
    isLoaded: audioState.isLoaded,
    playing: audioState.playing,
    currentTime: audioState.currentTime,
    duration: audioState.duration,
    error: audioState.error,
    playTrack: mockPlayTrack,
    toggle: mockToggle,
    pause: jest.fn(),
    seekTo: mockSeekTo,
    isCurrent: (url: string) => mockIsCurrent(url),
  }),
}));

const URL = "https://audio.example.com/ep.mp3";

const setCurrent = (over: Partial<typeof audioState>) => {
  mockIsCurrent.mockReturnValue(true);
  Object.assign(audioState, { currentUrl: URL, isLoaded: true, ...over });
};

describe("AudioPlayer (provider-bound controls)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(audioState, {
      currentUrl: null,
      isLoaded: false,
      playing: false,
      currentTime: 0,
      duration: 0,
      error: false,
    });
    mockIsCurrent.mockReturnValue(false);
  });

  it("shows a play button and starts the track when it is not current", async () => {
    const { getByLabelText } = await render(
      <AudioPlayer audioUrl={URL} title="Ep" resumeKey={URL} />,
    );
    await fireEvent.press(getByLabelText("Abspielen"));
    expect(mockPlayTrack).toHaveBeenCalledWith({
      audioUrl: URL,
      title: "Ep",
      artworkUrl: undefined,
      resumeKey: URL,
    });
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it("shows pause and toggles when the current track is playing", async () => {
    setCurrent({ playing: true, duration: 120, currentTime: 30 });
    const { getByLabelText } = await render(<AudioPlayer audioUrl={URL} />);
    await fireEvent.press(getByLabelText("Pause"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockPlayTrack).not.toHaveBeenCalled();
  });

  it("shows play and toggles when the current track is paused", async () => {
    setCurrent({ playing: false, duration: 120 });
    const { getByLabelText } = await render(<AudioPlayer audioUrl={URL} />);
    await fireEvent.press(getByLabelText("Abspielen"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("shows a spinner while the current track loads (showFeedback)", async () => {
    setCurrent({ isLoaded: false });
    const { getByTestId } = await render(
      <AudioPlayer audioUrl={URL} showFeedback />,
    );
    expect(getByTestId("spinner")).toBeTruthy();
  });

  it("shows an error message when the current track failed (showFeedback)", async () => {
    setCurrent({ isLoaded: false, error: true });
    const { getByText } = await render(
      <AudioPlayer audioUrl={URL} showFeedback />,
    );
    expect(getByText("Audio konnte nicht geladen werden.")).toBeTruthy();
  });

  it("shows the remaining time of the current track", async () => {
    setCurrent({ duration: 120, currentTime: 30 });
    const { getByText } = await render(<AudioPlayer audioUrl={URL} />);
    expect(getByText("1:30")).toBeTruthy();
  });

  it("shows the known duration as remaining before playback (idle)", async () => {
    const { getByText } = await render(
      <AudioPlayer audioUrl={URL} durationSeconds={120} />,
    );
    expect(getByText("2:00")).toBeTruthy();
  });
});
