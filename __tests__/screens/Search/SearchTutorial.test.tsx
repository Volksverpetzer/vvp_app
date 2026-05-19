import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

import SearchTutorial from "#/screens/Search/components/SearchTutorial";

jest.mock("#/components/Icons", () => ({
  SearchIcon: jest.fn(() => null),
  SafetyIcon: jest.fn(() => null),
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: { primary: "#1B7194" },
  dark: { primary: "#3893C0" },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { centered: {} },
}));

describe("SearchTutorial", () => {
  it("shows artikel tutorial by default", () => {
    const { getByText } = render(<SearchTutorial />);
    expect(getByText(/Suchbegriff/)).toBeTruthy();
  });

  it("shows artikel tutorial when tab='artikel'", () => {
    const { getByText, queryByText } = render(<SearchTutorial tab="artikel" />);
    expect(getByText(/Suchbegriff/)).toBeTruthy();
    expect(queryByText(/Frage/)).toBeNull();
  });

  it("shows AI tutorial when tab='ai'", () => {
    const { getByText, queryByText } = render(<SearchTutorial tab="ai" />);
    expect(getByText(/Frage/)).toBeTruthy();
    expect(getByText(/URL/)).toBeTruthy();
    expect(queryByText(/Suchbegriff/)).toBeNull();
  });

  it("artikel tutorial mentions the Suchen button", () => {
    const { getByText } = render(<SearchTutorial tab="artikel" />);
    expect(getByText(/Suchen/)).toBeTruthy();
  });

  it("AI tutorial mentions URL checking", () => {
    const { getByText } = render(<SearchTutorial tab="ai" />);
    expect(getByText(/URL/)).toBeTruthy();
  });
});
