import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react-native";
import { useContext } from "react";
import { Text } from "react-native";

import SettingsStore from "#/helpers/Stores/SettingsStore";
import { loadApiUrlOverride } from "#/helpers/apiUrl";
import {
  SettingsContext,
  SettingsProvider,
} from "#/helpers/provider/SettingsProvider";
import type { AdvancedSettingType, ContentSettingType } from "#/types";

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultContentSettings: {
      reddit: { value: true, name: "Memes" },
      wp: { value: true, name: "Artikel" },
      insta: { value: true, name: "Instagram Slides" },
      yt: { value: true, name: "YouTube Videos" },
      tiktok: { value: true, name: "TikTok Videos" },
      bsky: { value: false, name: "Bluesky Posts" },
      bot: { value: true, name: "Bot Feed" },
    },
    defaultAdvancedSettings: {
      advancedReporting: { value: false, name: "Erweitertes Reporting" },
    },
    defaultThemePreference: "system",
    getContentSettings: jest.fn(),
    getAdvancedSettings: jest.fn(),
    getThemePreference: jest.fn(),
    setContentSettings: jest.fn(),
    setAdvancedSettings: jest.fn(),
    setThemePreference: jest.fn(),
  },
}));

jest.mock("#/helpers/apiUrl", () => ({
  loadApiUrlOverride: jest.fn(),
}));

const mockSettingsStore = SettingsStore as jest.Mocked<typeof SettingsStore>;

const ConsumerComponent = () => {
  const { contentSettings, advancedSettings, themePreference } =
    useContext(SettingsContext);
  return (
    <>
      <Text testID="reddit">{String(contentSettings.reddit.value)}</Text>
      <Text testID="reporting">
        {String(advancedSettings.advancedReporting.value)}
      </Text>
      <Text testID="theme">{themePreference}</Text>
    </>
  );
};

describe("SettingsProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettingsStore.setContentSettings.mockResolvedValue(undefined as never);
    mockSettingsStore.setAdvancedSettings.mockResolvedValue(undefined as never);
    mockSettingsStore.setThemePreference.mockResolvedValue(undefined as never);
    mockSettingsStore.getThemePreference.mockResolvedValue("system");
    jest.mocked(loadApiUrlOverride).mockResolvedValue(undefined);
  });

  it("renders null while settings are loading", async () => {
    mockSettingsStore.getContentSettings.mockReturnValue(new Promise(() => {}));
    mockSettingsStore.getAdvancedSettings.mockReturnValue(
      new Promise(() => {}),
    );

    const { toJSON } = await render(
      <SettingsProvider>
        <Text testID="child">visible</Text>
      </SettingsProvider>,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders children after settings load", async () => {
    mockSettingsStore.getContentSettings.mockResolvedValue(
      {} as ContentSettingType,
    );
    mockSettingsStore.getAdvancedSettings.mockResolvedValue(
      {} as AdvancedSettingType,
    );

    const { getByTestId } = await render(
      <SettingsProvider>
        <Text testID="child">visible</Text>
      </SettingsProvider>,
    );

    await waitFor(() => getByTestId("child"));
    expect(getByTestId("child")).toBeTruthy();
  });

  it("waits for the app-server override before rendering children", async () => {
    mockSettingsStore.getContentSettings.mockResolvedValue(
      {} as ContentSettingType,
    );
    mockSettingsStore.getAdvancedSettings.mockResolvedValue(
      {} as AdvancedSettingType,
    );
    let resolveOverride: () => void = () => {};
    jest.mocked(loadApiUrlOverride).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveOverride = resolve;
      }),
    );

    const { queryByTestId, getByTestId } = await render(
      <SettingsProvider>
        <Text testID="child">visible</Text>
      </SettingsProvider>,
    );

    // Children fire requests on mount, so they must not render while the
    // override (and with it the server URL) is still unknown.
    expect(queryByTestId("child")).toBeNull();

    await act(() => {
      resolveOverride();
    });

    await waitFor(() => getByTestId("child"));
  });

  it("merges loaded settings over defaults", async () => {
    mockSettingsStore.getContentSettings.mockResolvedValue({
      reddit: { value: false, name: "Memes" },
    } as unknown as ContentSettingType);
    mockSettingsStore.getAdvancedSettings.mockResolvedValue({
      advancedReporting: { value: true, name: "Erweitertes Reporting" },
    } as AdvancedSettingType);
    mockSettingsStore.getThemePreference.mockResolvedValue("light");

    const { getByTestId } = await render(
      <SettingsProvider>
        <ConsumerComponent />
      </SettingsProvider>,
    );

    await waitFor(() => getByTestId("reddit"));
    expect(getByTestId("reddit").props.children).toBe("false");
    expect(getByTestId("reporting").props.children).toBe("true");
    expect(getByTestId("theme").props.children).toBe("light");
  });

  it("updates and persists the theme preference", async () => {
    mockSettingsStore.getContentSettings.mockResolvedValue(
      {} as ContentSettingType,
    );
    mockSettingsStore.getAdvancedSettings.mockResolvedValue(
      {} as AdvancedSettingType,
    );

    const ThemeSetter = () => {
      const { themePreference, setThemePreference } =
        useContext(SettingsContext);
      return (
        <Text testID="theme" onPress={() => setThemePreference("light")}>
          {themePreference}
        </Text>
      );
    };

    const { getByTestId } = await render(
      <SettingsProvider>
        <ThemeSetter />
      </SettingsProvider>,
    );

    await waitFor(() => getByTestId("theme"));
    expect(mockSettingsStore.setThemePreference).not.toHaveBeenCalled();
    await act(() => {
      getByTestId("theme").props.onPress();
    });

    expect(getByTestId("theme").props.children).toBe("light");
    expect(mockSettingsStore.setThemePreference).toHaveBeenCalledWith("light");
  });

  it("persists content settings changes to store", async () => {
    mockSettingsStore.getContentSettings.mockResolvedValue(
      {} as ContentSettingType,
    );
    mockSettingsStore.getAdvancedSettings.mockResolvedValue(
      {} as AdvancedSettingType,
    );

    const SetterComponent = () => {
      const { setContentSettings, contentSettings } =
        useContext(SettingsContext);
      return (
        <>
          <Text testID="reddit">{String(contentSettings.reddit.value)}</Text>
          <Text
            testID="toggle"
            onPress={() =>
              setContentSettings({
                ...contentSettings,
                reddit: { value: false, name: "Memes" },
              })
            }
          />
        </>
      );
    };

    const { getByTestId } = await render(
      <SettingsProvider>
        <SetterComponent />
      </SettingsProvider>,
    );

    await waitFor(() => getByTestId("toggle"));
    await act(() => {
      getByTestId("toggle").props.onPress();
    });

    await waitFor(() =>
      expect(mockSettingsStore.setContentSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reddit: { value: false, name: "Memes" } }),
      ),
    );
  });

  it("handles storage load errors gracefully and still renders", async () => {
    mockSettingsStore.getContentSettings.mockRejectedValue(
      new Error("storage failure"),
    );
    mockSettingsStore.getAdvancedSettings.mockRejectedValue(
      new Error("storage failure"),
    );

    const { getByTestId } = await render(
      <SettingsProvider>
        <Text testID="child">visible</Text>
      </SettingsProvider>,
    );

    await waitFor(() => getByTestId("child"));
    expect(getByTestId("child")).toBeTruthy();
  });
});
