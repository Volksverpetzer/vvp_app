import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import SearchResultItem from "#/screens/Search/components/SearchResultItem";

jest.mock("react-native-render-html", () => jest.fn(() => null));

jest.mock("html-entities", () => ({
  decode: jest.fn((s: string) => s),
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, testID }: any) => (
    <Text testID={testID ?? "heading"}>{children}</Text>
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
  return jest.fn(({ children, onPress, accessibilityRole, testID }: any) => (
    <Pressable
      testID={testID ?? "pressable"}
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

  describe("collapsible", () => {
    it("does not show a toggle when the excerpt fits in the collapsed height", async () => {
      const { queryByTestId } = await render(
        <SearchResultItem title="Title" text="<p>short</p>" collapsible />,
      );
      await fireEvent(queryByTestId("excerpt-measurer")!, "layout", {
        nativeEvent: { layout: { height: 40 } },
      });
      expect(queryByTestId("excerpt-toggle")).toBeNull();
    });

    it("shows a 'Mehr lesen' toggle once the excerpt overflows, and expands on tap", async () => {
      const { queryByTestId, getByTestId, getByText } = await render(
        <SearchResultItem title="Title" text="<p>long</p>" collapsible />,
      );
      await fireEvent(getByTestId("excerpt-measurer"), "layout", {
        nativeEvent: { layout: { height: 500 } },
      });
      expect(getByText("Mehr lesen")).toBeTruthy();

      await fireEvent.press(getByTestId("excerpt-toggle"));
      expect(getByText("Weniger anzeigen")).toBeTruthy();
      // The measurer is only needed while collapsed.
      expect(queryByTestId("excerpt-measurer")).toBeNull();
    });

    it("does not render a toggle when collapsible is not set", async () => {
      const { queryByTestId } = await render(
        <SearchResultItem title="Title" text="<p>content</p>" />,
      );
      expect(queryByTestId("excerpt-measurer")).toBeNull();
      expect(queryByTestId("excerpt-toggle")).toBeNull();
    });
  });
});
