import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";
import { Animated, Pressable, Text } from "react-native";

import UnicornEasterEgg from "#/components/animations/UnicornEasterEgg";

let mockMascot: number | null = 1;
jest.mock("#/helpers/AppImages", () => ({
  AppImages: {
    get announcementMascot() {
      return mockMascot;
    },
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { accent: "#DB2685" },
    dark: { accent: "#D31C74" },
  },
}));

// Advance fake timers inside act() so the state update triggered by the
// (synchronously-resolving, see below) Animated.spring callback is flushed
// and reflected before assertions run.
const advanceTimers = (ms: number) => act(() => jest.advanceTimersByTime(ms));

describe("UnicornEasterEgg", () => {
  beforeEach(() => {
    mockMascot = 1;
    jest.useFakeTimers();
    jest.clearAllTimers();
    // Real spring physics don't matter here; resolve every animation
    // synchronously so timer-based assertions aren't coupled to it.
    jest.spyOn(Animated, "spring").mockImplementation(((
      value: Animated.Value,
      config: { toValue: number },
    ) => ({
      start: (callback?: (result: { finished: boolean }) => void) => {
        value.setValue(config.toValue);
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    })) as unknown as typeof Animated.spring);
  });

  afterEach(async () => {
    // This project's jest setup doesn't auto-run RNTL's cleanup between
    // tests, so a tree left mounted by one test — especially one whose
    // fake-timer-driven dismiss already fired — can interfere with the
    // next test's render. Every test below unmounts explicitly, but clean
    // up defensively too.
    await cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders nothing when not visible", async () => {
    const { toJSON, unmount } = await render(
      <UnicornEasterEgg visible={false} onHide={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
    await unmount();
  });

  it("centers the circle on the measured mascot+message block, not a guessed height", async () => {
    const { getByTestId, unmount } = await render(
      <UnicornEasterEgg
        visible
        onHide={jest.fn()}
        message="Juhu, Level geschafft!"
      />,
    );

    const contentView = getByTestId("unicorn-easter-egg-content", {
      includeHiddenElements: true,
    });
    await act(() => {
      fireEvent(contentView, "layout", {
        nativeEvent: { layout: { height: 400, width: 200, x: 0, y: 0 } },
      });
    });

    const circleStyle = getByTestId("unicorn-easter-egg-circle", {
      includeHiddenElements: true,
    }).props.style;
    // The circle's own vertical center (top + diameter/2) must land on the
    // measured content's vertical center (height/2) — i.e. `top` cancels
    // out to exactly half the surplus between the circle and the content,
    // regardless of the circle being larger than the content.
    expect(circleStyle.top + circleStyle.height / 2).toBeCloseTo(400 / 2, 5);
    await unmount();
  });

  it("renders nothing when there is no mascot asset (e.g. Mimikama)", async () => {
    mockMascot = null;
    const { toJSON, unmount } = await render(
      <UnicornEasterEgg visible onHide={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
    await unmount();
  });

  it("shows the mascot when visible and a mascot asset exists", async () => {
    const { toJSON, unmount } = await render(
      <UnicornEasterEgg visible onHide={jest.fn()} />,
    );
    expect(toJSON()).not.toBeNull();
    await unmount();
  });

  it("shows the optional message caption when provided", async () => {
    const { queryByText, unmount } = await render(
      <UnicornEasterEgg
        visible
        onHide={jest.fn()}
        message="Juhu, Level geschafft!"
      />,
    );
    expect(queryByText("Juhu, Level geschafft!")).not.toBeNull();
    await unmount();
  });

  it("renders no caption when no message is provided", async () => {
    const { queryByText, unmount } = await render(
      <UnicornEasterEgg visible onHide={jest.fn()} />,
    );
    expect(queryByText("Juhu, Level geschafft!")).toBeNull();
    await unmount();
  });

  it("does not restart the dismiss timer when the parent re-renders (recreating onHide) but visible stays true", async () => {
    // Regression test: onHide used to be a dependency of the effect that
    // schedules the auto-dismiss, so a parent re-render that recreates the
    // callback (without visible ever changing, e.g. an unrelated async
    // state update elsewhere on the Settings screen) cleared and
    // rescheduled the 5s timeout. Asserted via setTimeout/clearTimeout
    // call counts, rather than letting 5s of fake time actually elapse,
    // since the component's effect never needs to see the countdown
    // complete to prove it wasn't torn down and restarted.
    const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");

    const Harness = () => {
      const [, bump] = useState(0);
      return (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => bump((n) => n + 1)}
          >
            <Text>bump</Text>
          </Pressable>
          <UnicornEasterEgg visible onHide={() => {}} />
        </>
      );
    };

    const { getByText, unmount } = await render(<Harness />);
    const scheduledCallsAfterMount = setTimeoutSpy.mock.calls.length;
    expect(scheduledCallsAfterMount).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.press(getByText("bump"));
      await Promise.resolve();
    });

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    expect(setTimeoutSpy.mock.calls.length).toBe(scheduledCallsAfterMount);
    await unmount();
  });

  it("dismisses early on the Android back action instead of swallowing it", async () => {
    const onHide = jest.fn();
    const { getByTestId, unmount } = await render(
      <UnicornEasterEgg visible onHide={onHide} />,
    );

    await act(async () => {
      // RNTL treats a Modal's contents as hidden by default.
      getByTestId("unicorn-easter-egg-modal", {
        includeHiddenElements: true,
      }).props.onRequestClose();
      await Promise.resolve();
    });

    expect(onHide).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("auto-dismisses after 5 seconds", async () => {
    const onHide = jest.fn();
    const { unmount } = await render(
      <UnicornEasterEgg visible onHide={onHide} />,
    );

    expect(onHide).not.toHaveBeenCalled();
    advanceTimers(4999);
    expect(onHide).not.toHaveBeenCalled();
    advanceTimers(1);
    expect(onHide).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("clears the pending dismiss timer on unmount", async () => {
    const onHide = jest.fn();
    const { unmount } = await render(
      <UnicornEasterEgg visible onHide={onHide} />,
    );

    await unmount();
    advanceTimers(5000);

    expect(onHide).not.toHaveBeenCalled();
  });
});
