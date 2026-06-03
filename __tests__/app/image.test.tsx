import { render } from "@testing-library/react-native";
import React from "react";

import ImageScreen from "#/app/image";

jest.mock("@likashefqet/react-native-image-zoom", () => ({
  Zoomable: jest.fn(({ children }: any) => children),
}));

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({
    uri: "https://example.com/photo.jpg",
  })),
}));

jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));

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

describe("ImageScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders without crashing", () => {
    const { toJSON } = render(<ImageScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it("passes the uri from search params to the Image", () => {
    const { Image } = jest.requireMock("expo-image");
    render(<ImageScreen />);
    const [props] = Image.mock.calls[0];
    expect(props.source.uri).toBe("https://example.com/photo.jpg");
  });

  it("renders the NavBar", () => {
    const NavBar = jest.requireMock("#/components/bars/NavBar");
    render(<ImageScreen />);
    expect(NavBar).toHaveBeenCalled();
  });

  it("applies background color from color scheme", () => {
    const { toJSON } = render(<ImageScreen />);
    const root = toJSON() as any;
    expect(root.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#ffffff" }),
    );
  });
});
