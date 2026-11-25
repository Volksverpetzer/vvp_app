import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import { registerEvent } from "#/helpers/network/Analytics";
import {
  SESSION_TIMEOUT_MS,
  resetScreenViewSession,
  screenNameFromSegments,
  useScreenViewTracking,
} from "#/hooks/useScreenViewTracking";

let mockSegments: string[] = [];

jest.mock("expo-router", () => ({
  useSegments: () => mockSegments,
}));

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(() => Promise.resolve()),
}));

const mockRegisterEvent = registerEvent as jest.MockedFunction<
  typeof registerEvent
>;

describe("screenNameFromSegments", () => {
  it.each([
    [["(tabs)", "home"], "home"],
    [["(tabs)", "personal"], "personal"],
    [["(tabs)", "settings"], "settings"],
    [["search"], "search"],
    [["onboarding"], "onboarding"],
    [["game"], "game"],
    [["game", "[gameId]"], "game"],
    [["bsky", "[post_id]"], "bsky"],
    [["insta", "[post_id]"], "insta"],
    [["podcast", "[id]"], "podcast"],
    [["+not-found"], "not-found"],
  ])("maps %j to %s", (segments, expected) => {
    expect(screenNameFromSegments(segments)).toBe(expected);
  });

  it.each([
    [[]],
    [["[category]"]],
    [["[category]", "[slug]"]],
    [["handle-share"]],
    [["external-link"]],
  ])("skips %j", (segments) => {
    expect(screenNameFromSegments(segments)).toBeNull();
  });
});

describe("useScreenViewTracking", () => {
  let appStateListener: (state: string) => void;
  let nowSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetScreenViewSession();
    mockSegments = ["(tabs)", "home"];
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        appStateListener = listener as (state: string) => void;
        return { remove: jest.fn() } as never;
      });
    nowSpy = jest.spyOn(Date, "now").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends a Screen View with the screen name", async () => {
    await renderHook(() => useScreenViewTracking());
    expect(mockRegisterEvent).toHaveBeenCalledTimes(1);
    expect(mockRegisterEvent).toHaveBeenCalledWith("", "Screen View", {
      screen: "home",
    });
  });

  it("counts each screen only once per session", async () => {
    const { rerender } = await renderHook(() => useScreenViewTracking());
    mockSegments = ["(tabs)", "settings"];
    await rerender({});
    mockSegments = ["(tabs)", "home"];
    await rerender({});
    mockSegments = ["(tabs)", "settings"];
    await rerender({});

    expect(mockRegisterEvent.mock.calls.map((call) => call[2])).toEqual([
      { screen: "home" },
      { screen: "settings" },
    ]);
  });

  it("does not send for articles", async () => {
    mockSegments = ["[category]", "[slug]"];
    await renderHook(() => useScreenViewTracking());
    expect(mockRegisterEvent).not.toHaveBeenCalled();
  });

  it("keeps the session after a short background", async () => {
    await renderHook(() => useScreenViewTracking());
    appStateListener("background");
    nowSpy.mockReturnValue(SESSION_TIMEOUT_MS - 1);
    await act(() => appStateListener("active"));
    expect(mockRegisterEvent).toHaveBeenCalledTimes(1);
  });

  it("starts a new session and counts the current screen after the timeout", async () => {
    const { rerender } = await renderHook(() => useScreenViewTracking());
    mockSegments = ["search"];
    await rerender({});
    appStateListener("background");
    nowSpy.mockReturnValue(SESSION_TIMEOUT_MS);
    await act(() => appStateListener("active"));

    expect(mockRegisterEvent.mock.calls.map((call) => call[2])).toEqual([
      { screen: "home" },
      { screen: "search" },
      { screen: "search" },
    ]);

    // Home counts again in the new session.
    mockSegments = ["(tabs)", "home"];
    await rerender({});
    expect(mockRegisterEvent).toHaveBeenLastCalledWith("", "Screen View", {
      screen: "home",
    });
  });
});
