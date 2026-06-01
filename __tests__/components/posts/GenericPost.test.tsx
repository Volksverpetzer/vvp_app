import { render } from "@testing-library/react-native";
import React from "react";

import GenericPost from "#/components/posts/GenericPost";

jest.mock("#/components/bars/ShareBar", () => {
  const { Text } = require("react-native");
  return jest.fn(() => <Text testID="share-bar" />);
});

jest.mock("#/components/ui/UiCard", () => {
  const { View } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <View style={style}>{children}</View>
  ));
});

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { background: "#ffffff" },
    dark: { background: "#000000" },
  },
}));

const MockComponent = jest.fn(() => null) as React.FC<{ inView: boolean }>;

describe("GenericPost", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders ShareBar when shareable prop is provided", () => {
    const { getByTestId } = render(
      <GenericPost
        component={MockComponent}
        data={{}}
        inView
        shareable={[{ url: "https://example.com", title: "Test" }]}
      />,
    );
    expect(getByTestId("share-bar")).toBeTruthy();
  });

  it("renders no ShareBar when shareable prop is not provided", () => {
    const { queryByTestId } = render(
      <GenericPost component={MockComponent} data={{}} inView />,
    );
    expect(queryByTestId("share-bar")).toBeNull();
  });
});
