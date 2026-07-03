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
  useCorporateColor: jest.fn(() => "#1B7194"),
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

  it("renders without crashing", async () => {
    const { toJSON } = await render(<ImageScreen />);
    expect(toJSON()).not.toBeNull();
  });

  it("passes the uri from search params to the Image", async () => {
    const { Image } = jest.requireMock("expo-image");
    await render(<ImageScreen />);
    const [props] = Image.mock.calls[0];
    expect(props.source.uri).toBe("https://example.com/photo.jpg");
  });

  it("renders the NavBar", async () => {
    const NavBar = jest.requireMock("#/components/bars/NavBar");
    await render(<ImageScreen />);
    expect(NavBar).toHaveBeenCalled();
  });

  it("applies background color from color scheme", async () => {
    const { toJSON } = await render(<ImageScreen />);
    const root = toJSON() as any;
    expect(root.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#ffffff" }),
    );
  });

  it("shows an empty state instead of the Image when uri is missing", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValueOnce({});
    const { Image } = jest.requireMock("expo-image");
    const { getByText } = await render(<ImageScreen />);
    expect(Image).not.toHaveBeenCalled();
    expect(getByText("Bild konnte nicht geladen werden")).toBeTruthy();
  });

  it("shows an empty state instead of the Image when uri is an array", async () => {
    const { useLocalSearchParams } = jest.requireMock("expo-router");
    useLocalSearchParams.mockReturnValueOnce({ uri: ["a.jpg", "b.jpg"] });
    const { Image } = jest.requireMock("expo-image");
    const { getByText } = await render(<ImageScreen />);
    expect(Image).not.toHaveBeenCalled();
    expect(getByText("Bild konnte nicht geladen werden")).toBeTruthy();
  });
});
