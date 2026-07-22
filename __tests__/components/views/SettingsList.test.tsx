import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

import SettingsList from "#/components/views/SettingsList";

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, onPress, ...props }: any) => (
    <Pressable onPress={onPress} {...props}>
      {children}
    </Pressable>
  ));
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: {
    primary: "#e63312",
    primaryMuted: "#eee",
    textMuted: "#999",
    surface: "#fff",
    surfaceDisabled: "#ccc",
    surfaceInput: "#eee",
    onPrimary: "#fff",
  },
}));

jest.mock("#/helpers/Stores/SettingsStore", () => ({
  __esModule: true,
  default: {
    defaultContentSettings: {},
  },
}));

jest.mock("#/helpers/utils/feeds", () => ({
  getEnabledFeeds: jest.fn(() => []),
}));

const settings = {
  a: { value: true, name: "A Setting" },
  b: { value: true, name: "B Setting" },
  c: { value: true, name: "C Setting" },
};

describe("SettingsList", () => {
  it("only disables the toggled switch while its save is pending, not the others", async () => {
    let resolveSave: () => void = () => {};
    const saveSettings = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const { getAllByTestId } = await render(
      <SettingsList saveSettings={saveSettings} settings={settings} />,
    );

    // Alphabetical order: A, B, C
    await fireEvent(getAllByTestId("settingSwitch")[0], "valueChange", false);

    const midFlightSwitches = getAllByTestId("settingSwitch");
    expect(midFlightSwitches[0].props.disabled).toBe(true);
    expect(midFlightSwitches[1].props.disabled).toBe(false);
    expect(midFlightSwitches[2].props.disabled).toBe(false);

    resolveSave();

    await waitFor(() => {
      expect(getAllByTestId("settingSwitch")[0].props.disabled).toBe(false);
    });
  });

  it("re-enables the switch even when the save rejects", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let rejectSave: (error: Error) => void = () => {};
    const saveSettings = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSave = reject;
        }),
    );

    const { getAllByTestId } = await render(
      <SettingsList saveSettings={saveSettings} settings={settings} />,
    );

    await fireEvent(getAllByTestId("settingSwitch")[0], "valueChange", false);
    expect(getAllByTestId("settingSwitch")[0].props.disabled).toBe(true);

    rejectSave(new Error("network error"));

    await waitFor(() => {
      expect(getAllByTestId("settingSwitch")[0].props.disabled).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  it("re-enables the switch even when saveSettings throws synchronously", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const saveSettings = jest.fn(() => {
      throw new Error("sync failure");
    });

    const { getAllByTestId } = await render(
      <SettingsList saveSettings={saveSettings} settings={settings} />,
    );

    await fireEvent(getAllByTestId("settingSwitch")[0], "valueChange", false);

    await waitFor(() => {
      expect(getAllByTestId("settingSwitch")[0].props.disabled).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  describe("disabled (permission denied)", () => {
    it("disables every switch and shows off, regardless of the stored value", async () => {
      const saveSettings = jest.fn(() => {});
      const { getAllByTestId } = await render(
        <SettingsList
          saveSettings={saveSettings}
          settings={settings}
          disabled
        />,
      );

      for (const switchElement of getAllByTestId("settingSwitch")) {
        expect(switchElement.props.disabled).toBe(true);
        expect(switchElement.props.value).toBe(false);
      }
    });

    it("shows the disabled message and opens Settings when pressed", async () => {
      const saveSettings = jest.fn(() => {});
      const onDisabledPress = jest.fn();
      const { getByText } = await render(
        <SettingsList
          saveSettings={saveSettings}
          settings={settings}
          disabled
          disabledMessage="Benachrichtigungen sind deaktiviert."
          onDisabledPress={onDisabledPress}
        />,
      );

      const message = getByText("Benachrichtigungen sind deaktiviert.");
      expect(message).toBeTruthy();
      await fireEvent.press(message);
      expect(onDisabledPress).toHaveBeenCalledTimes(1);
    });

    it("does not render a message row when disabledMessage is not provided", async () => {
      const saveSettings = jest.fn(() => {});
      const { queryAllByRole } = await render(
        <SettingsList
          saveSettings={saveSettings}
          settings={settings}
          disabled
        />,
      );

      expect(queryAllByRole("button")).toHaveLength(0);
    });

    it("does not disable switches when disabled is false", async () => {
      const saveSettings = jest.fn(() => {});
      const { getAllByTestId } = await render(
        <SettingsList
          saveSettings={saveSettings}
          settings={settings}
          disabled={false}
        />,
      );

      for (const switchElement of getAllByTestId("settingSwitch")) {
        expect(switchElement.props.disabled).toBe(false);
      }
    });
  });
});
