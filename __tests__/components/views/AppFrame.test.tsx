import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React from "react";
import { Platform, Text } from "react-native";
import type { ReactTestRendererJSON } from "react-test-renderer";

import AppFrame from "#/components/views/AppFrame";
import Colors from "#/constants/Colors";
import { ColorScheme, useAppColorScheme } from "#/hooks/useAppColorScheme";

const mockUseSegments = jest.fn<() => string[]>();
const mockThemeProvider = jest.fn(
  ({ children }: { children: React.ReactNode; value: unknown }) => children,
);

jest.mock("expo-router", () => ({
  __esModule: true,
  DefaultTheme: {
    dark: false,
    colors: { background: "rgb(242, 242, 242)", card: "light-card" },
  },
  DarkTheme: {
    dark: true,
    colors: { background: "rgb(1, 1, 1)", card: "dark-card" },
  },
  ThemeProvider: (props: { children: React.ReactNode; value: unknown }) =>
    mockThemeProvider(props),
  useSegments: () => mockUseSegments(),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: jest.fn(() => null),
}));

jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  ...jest.requireActual<object>("#/hooks/useAppColorScheme"),
  useAppColorScheme: jest.fn(),
}));

const setBackgroundColorAsync = SystemUI.setBackgroundColorAsync as jest.Mock<
  (color: string) => Promise<void>
>;
const statusBar = StatusBar as unknown as jest.Mock;
const originalOS = Platform.OS;

const setOS = (os: typeof Platform.OS) =>
  Object.defineProperty(Platform, "OS", { configurable: true, value: os });

const renderFrame = async () => {
  const result = await render(
    <AppFrame>
      <Text>content</Text>
    </AppFrame>,
  );
  const root = result.toJSON() as ReactTestRendererJSON;
  return {
    ...result,
    rootStyle: root.props.style as {
      backgroundColor: string;
      paddingTop: number;
    },
  };
};

const lastThemeValue = () =>
  mockThemeProvider.mock.calls.at(-1)?.[0].value as {
    dark: boolean;
    colors: { background: string; card: string };
  };

describe("AppFrame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSegments.mockReturnValue(["(tabs)", "home"]);
    (useAppColorScheme as jest.Mock).mockReturnValue(ColorScheme.light);
  });

  afterEach(() => {
    setOS(originalOS);
  });

  it("renders its children below the top safe-area inset", async () => {
    const { getByText, rootStyle } = await renderFrame();
    expect(getByText("content")).toBeTruthy();
    expect(rootStyle.paddingTop).toBe(24);
  });

  it.each([ColorScheme.light, ColorScheme.dark])(
    "gives React Navigation the %s app background as theme background",
    async (scheme) => {
      (useAppColorScheme as jest.Mock).mockReturnValue(scheme);
      await renderFrame();
      const theme = lastThemeValue();
      expect(theme.dark).toBe(scheme === ColorScheme.dark);
      expect(theme.colors.background).toBe(Colors[scheme].background);
      // The rest of the base theme is kept.
      expect(theme.colors.card).toBe(
        scheme === ColorScheme.dark ? "dark-card" : "light-card",
      );
    },
  );

  it("uses the background color and dark status bar text in light mode", async () => {
    const { rootStyle } = await renderFrame();
    expect(rootStyle.backgroundColor).toBe(Colors.light.background);
    expect(statusBar.mock.calls.at(-1)?.[0]).toEqual({
      style: "dark",
    });
  });

  it("uses light status bar text in dark mode", async () => {
    (useAppColorScheme as jest.Mock).mockReturnValue(ColorScheme.dark);
    await renderFrame();
    expect(statusBar.mock.calls.at(-1)?.[0]).toEqual({
      style: "light",
    });
  });

  it.each(["action", "support"])(
    "uses the surface color on the %s screen",
    async (segment) => {
      mockUseSegments.mockReturnValue(["(tabs)", segment]);
      const { rootStyle } = await renderFrame();
      expect(rootStyle.backgroundColor).toBe(Colors.light.surface);
    },
  );

  it("syncs the native root background color", async () => {
    setOS("ios");
    await renderFrame();
    await waitFor(() =>
      expect(setBackgroundColorAsync).toHaveBeenCalledWith(
        Colors.light.background,
      ),
    );
  });

  it("warns when the native background color cannot be set", async () => {
    setOS("ios");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const error = new Error("unavailable");
    setBackgroundColorAsync.mockReturnValueOnce(Promise.reject(error));
    await renderFrame();
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        "Failed to set system background color",
        error,
      ),
    );
    warn.mockRestore();
  });

  it("does not touch the native background on web", async () => {
    setOS("web");
    await renderFrame();
    expect(setBackgroundColorAsync).not.toHaveBeenCalled();
  });
});
