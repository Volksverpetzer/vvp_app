import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

import SettingsList from "#/components/views/SettingsList";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { feeds: {}, hiddenNotifications: ["new_fact_check"] },
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, ...props }: any) => (
    <Pressable {...props}>{children}</Pressable>
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
  default: { defaultContentSettings: {} },
}));
jest.mock("#/helpers/utils/feeds", () => ({
  getEnabledFeeds: jest.fn(() => []),
}));

describe("SettingsList with hidden notification types", () => {
  it("does not render a switch for a type the variant hides", async () => {
    const { queryByText, getByText, getAllByTestId } = await render(
      <SettingsList
        saveSettings={jest.fn<() => Promise<void>>()}
        settings={{
          new_post: { value: true, name: "Neuer Artikel" },
          new_fact_check: { value: false, name: "Neuer Faktencheck" },
        }}
      />,
    );
    expect(getByText("Neuer Artikel")).toBeTruthy();
    expect(queryByText("Neuer Faktencheck")).toBeNull();
    expect(getAllByTestId("settingSwitch")).toHaveLength(1);
  });
});
