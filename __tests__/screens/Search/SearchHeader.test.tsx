import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React, { createRef } from "react";
import type { TextInput } from "react-native";

import { toast } from "#/helpers/toast";
import SearchHeader from "#/screens/Search/components/SearchHeader";

jest.mock("#/components/animations/FaktenBot", () =>
  jest.fn(({ testID }: any) => {
    const { View } = require("react-native");
    return <View testID={testID ?? "faktenbot"} />;
  }),
);

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/components/Icons", () => ({
  SearchIcon: jest.fn(() => null),
}));

jest.mock("#/components/ui/HeaderGradient", () => {
  const { View } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <View testID="header-gradient" style={style}>
      {children}
    </View>
  ));
});

jest.mock("#/helpers/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    confirm: jest.fn(),
  },
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: { background: "#FFF", surface: "#E2F0F5", primary: "#1B7194" },
  dark: { background: "#050D0f", surface: "#142228", primary: "#3893C0" },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { row: {}, input: {}, whiteText: {} },
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
    it("shows 'Artikel-Suche' when showFaktenBot is false", async () => {
      const { getByText } = await render(
        <SearchHeader {...baseProps} showFaktenBot={false} />,
      );
      expect(getByText("Artikel-Suche")).toBeTruthy();
    });

    it("shows 'Fact Check' when showFaktenBot is true", async () => {
      const { getByText } = await render(
        <SearchHeader {...baseProps} showFaktenBot={true} />,
      );
      expect(getByText("Fact Check")).toBeTruthy();
    });

    it("defaults to 'Fact Check' when showFaktenBot is omitted", async () => {
      const { getByText } = await render(<SearchHeader {...baseProps} />);
      expect(getByText("Fact Check")).toBeTruthy();
    });
  });

  describe("header background", () => {
    it("renders the header inside the shared HeaderGradient with no solid fill", async () => {
      const { getByTestId } = await render(
        <SearchHeader {...baseProps} showFaktenBot={false} />,
      );
      // The header no longer paints a solid block behind the title; it uses the
      // app-wide HeaderGradient (fading into the surface below) so it matches
      // the other headers. It must therefore set neither a solid background
      // nor the surface color on the header container itself.
      const header = getByTestId("header-gradient");
      const flatStyle = ([] as any[]).concat(header.props.style).flat();
      expect(flatStyle).not.toContainEqual(
        expect.objectContaining({ backgroundColor: "#FFF" }),
      );
      expect(flatStyle).not.toContainEqual(
        expect.objectContaining({ backgroundColor: "#E2F0F5" }),
      );
    });
  });

  describe("search validation", () => {
    it("shows an info toast when fewer than 2 characters are submitted", async () => {
      const { getByLabelText } = await render(
        <SearchHeader {...baseProps} search="a" />,
      );
      await fireEvent(getByLabelText("Text input field"), "submitEditing");
      expect(toast.info).toHaveBeenCalledWith(
        "Bitte mindestens 2 Zeichen eingeben",
      );
    });

    it("does not show a toast when 2 or more characters are submitted", async () => {
      const { getByLabelText } = await render(
        <SearchHeader {...baseProps} search="ab" />,
      );
      await fireEvent(getByLabelText("Text input field"), "submitEditing");
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  describe("FaktenBot visibility", () => {
    it("renders FaktenBot when showFaktenBot is true", async () => {
      const { getByTestId } = await render(
        <SearchHeader {...baseProps} showFaktenBot={true} />,
      );
      expect(getByTestId("faktenbot")).toBeTruthy();
    });

    it("does not render FaktenBot when showFaktenBot is false", async () => {
      const { queryByTestId } = await render(
        <SearchHeader {...baseProps} showFaktenBot={false} />,
      );
      expect(queryByTestId("faktenbot")).toBeNull();
    });
  });
});
