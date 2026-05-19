import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import PersonalTab from "#/app/(tabs)/personal";

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("#/components/animations/AnimatedHeader", () => {
  const { View } = require("react-native");
  return jest.fn(({ children }: any) => <View>{children}</View>);
});

jest.mock("#/components/design/View", () => {
  const { View } = require("react-native");
  return jest.fn(({ children }: any) => <View>{children}</View>);
});

jest.mock("#/constants/Colors", () => ({
  light: {
    primary: "#1b7194",
    surface: "#E2F0F5",
    iconMuted: "#aaa",
    iconOnPrimary: "#3893C0",
    muted: "#bbb",
    text: "#111",
  },
}));

jest.mock("#/helpers/provider/BadgeProvider", () => ({
  updateBadgeState: jest.fn(),
}));

jest.mock("#/screens/PersonalTab/components/MyFavs", () => {
  const { Text } = require("react-native");
  return jest.fn(() => <Text>MyFavs</Text>);
});

jest.mock("#/screens/PersonalTab/components/MySources", () => {
  const { Text } = require("react-native");
  return jest.fn(() => <Text>MySources</Text>);
});

jest.mock("react-native-gesture-handler", () => ({
  ScrollView: jest.fn(({ children }: any) => children),
}));

jest.mock("@expo/vector-icons/Octicons", () => jest.fn(() => null));

describe("PersonalTab", () => {
  it("renders Favoriten and Quellen tab buttons", () => {
    const { getByText } = render(<PersonalTab />);
    expect(getByText("Favoriten")).toBeTruthy();
    expect(getByText("Quellen")).toBeTruthy();
  });

  it("shows MyFavs by default", () => {
    const { getByText } = render(<PersonalTab />);
    expect(getByText("MyFavs")).toBeTruthy();
  });

  it("switches to MySources when Quellen tab is pressed", () => {
    const { getByText, queryByText } = render(<PersonalTab />);
    fireEvent.press(getByText("Quellen"));
    expect(getByText("MySources")).toBeTruthy();
    expect(queryByText("MyFavs")).toBeNull();
  });

  it("switches back to MyFavs when Favoriten tab is pressed", () => {
    const { getByText, queryByText } = render(<PersonalTab />);
    fireEvent.press(getByText("Quellen"));
    fireEvent.press(getByText("Favoriten"));
    expect(getByText("MyFavs")).toBeTruthy();
    expect(queryByText("MySources")).toBeNull();
  });
});
