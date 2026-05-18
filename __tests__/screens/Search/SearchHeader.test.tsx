import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React, { createRef } from "react";
import type { TextInput } from "react-native";

import SearchHeader from "#/screens/Search/components/SearchHeader";

jest.mock("#/components/animations/FaktenBot", () =>
  jest.fn(({ testID }: any) => {
    const { View } = require("react-native");
    return <View testID={testID ?? "faktenbot"} />;
  }),
);

jest.mock("#/components/design/View", () => {
  const { View } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <View style={style}>{children}</View>
  ));
});

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/components/Icons", () => ({
  SearchIcon: jest.fn(() => null),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: { surface: "#E2F0F5", primary: "#1B7194" },
  dark: { surface: "#142228", primary: "#3893C0" },
}));

jest.mock("#/constants/Styles", () => ({
  styles: { row: {}, input: {}, whiteText: {} },
}));

const baseProps = {
  search: "",
  setSearch: jest.fn(),
  setSearchParams: jest.fn(),
  searchRef: createRef<TextInput>(),
  isLoading: false,
};

describe("SearchHeader", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("headline text", () => {
    it("shows 'Artikel Suche' when showFaktenBot is false", () => {
      const { getByText } = render(
        <SearchHeader {...baseProps} showFaktenBot={false} />,
      );
      expect(getByText("Artikel Suche")).toBeTruthy();
    });

    it("shows 'Fact Check' when showFaktenBot is true", () => {
      const { getByText } = render(
        <SearchHeader {...baseProps} showFaktenBot={true} />,
      );
      expect(getByText("Fact Check")).toBeTruthy();
    });

    it("defaults to 'Fact Check' when showFaktenBot is omitted", () => {
      const { getByText } = render(<SearchHeader {...baseProps} />);
      expect(getByText("Fact Check")).toBeTruthy();
    });
  });

  describe("FaktenBot visibility", () => {
    it("renders FaktenBot when showFaktenBot is true", () => {
      const { getByTestId } = render(
        <SearchHeader {...baseProps} showFaktenBot={true} />,
      );
      expect(getByTestId("faktenbot")).toBeTruthy();
    });

    it("does not render FaktenBot when showFaktenBot is false", () => {
      const { queryByTestId } = render(
        <SearchHeader {...baseProps} showFaktenBot={false} />,
      );
      expect(queryByTestId("faktenbot")).toBeNull();
    });
  });
});
