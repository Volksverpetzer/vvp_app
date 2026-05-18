import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";

import SearchTutorial from "#/screens/Search/components/SearchTutorial";

jest.mock("#/components/animations/FaktenBot", () => jest.fn(() => null));

jest.mock("#/components/design/Card", () => {
  const { View } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <View style={style}>{children}</View>
  ));
});

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

describe("SearchTutorial", () => {
  it("shows artikel tutorial by default", () => {
    const { getByText } = render(<SearchTutorial />);
    expect(getByText(/Artikel-Suche/)).toBeTruthy();
    expect(getByText(/Echtzeit-Vorschläge/)).toBeTruthy();
  });

  it("shows artikel tutorial when tab='artikel'", () => {
    const { getByText, queryByText } = render(<SearchTutorial tab="artikel" />);
    expect(getByText(/Artikel-Suche/)).toBeTruthy();
    expect(queryByText(/KI-Faktenbot/)).toBeNull();
  });

  it("shows AI tutorial when tab='ai'", () => {
    const { getByText, queryByText } = render(<SearchTutorial tab="ai" />);
    expect(getByText(/KI-Faktenbot/)).toBeTruthy();
    expect(getByText(/URL/)).toBeTruthy();
    expect(queryByText(/Artikel-Suche/)).toBeNull();
  });

  it("artikel tutorial mentions the Suchen button", () => {
    const { getByText } = render(<SearchTutorial tab="artikel" />);
    expect(getByText(/Suchen/)).toBeTruthy();
  });

  it("AI tutorial mentions URL checking", () => {
    const { getByText } = render(<SearchTutorial tab="ai" />);
    expect(getByText(/URL ein/)).toBeTruthy();
  });
});
