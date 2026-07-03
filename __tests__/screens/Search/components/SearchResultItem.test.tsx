import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import SearchResultItem from "#/screens/Search/components/SearchResultItem";

jest.mock("react-native-render-html", () => jest.fn(() => null));

jest.mock("html-entities", () => ({
  decode: jest.fn((s: string) => s),
}));

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => (
    <Text testID="heading">{children}</Text>
  ));
});

jest.mock("#/components/ui/UiCard", () => {
  const { View } = require("react-native");
  return jest.fn(({ children }: any) => (
    <View testID="ui-card">{children}</View>
  ));
});

jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, onPress, accessibilityRole }: any) => (
    <Pressable
      testID="pressable"
      onPress={onPress}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </Pressable>
  ));
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { text: "#111111" },
    dark: { text: "#f7f7f7" },
  },
}));

jest.mock("#/helpers/utils/color", () => ({
  getTagStyles: jest.fn(() => ({})),
}));

describe("SearchResultItem", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders inside a plain View when onPress is not provided", async () => {
    const { getByTestId, queryByTestId } = await render(
      <SearchResultItem title="Test Title" text="<p>Test</p>" />,
    );
    expect(getByTestId("ui-card")).toBeTruthy();
    expect(queryByTestId("pressable")).toBeNull();
  });

  it("renders inside a UiPressable when onPress is provided", async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <SearchResultItem
        title="Test Title"
        text="<p>Test</p>"
        onPress={onPress}
      />,
    );
    expect(getByTestId("pressable")).toBeTruthy();
  });

  it("calls onPress when the pressable is tapped", async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <SearchResultItem
        title="Test Title"
        text="<p>Test</p>"
        onPress={onPress}
      />,
    );
    await fireEvent.press(getByTestId("pressable"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders the title as a Heading", async () => {
    const { getByTestId } = await render(
      <SearchResultItem title="My Title" text="<p>content</p>" />,
    );
    expect(getByTestId("heading").props.children).toBe("My Title");
  });

  it("renders no Heading when title is empty", async () => {
    const { queryByTestId } = await render(
      <SearchResultItem title="" text="<p>content</p>" />,
    );
    expect(queryByTestId("heading")).toBeNull();
  });
});
