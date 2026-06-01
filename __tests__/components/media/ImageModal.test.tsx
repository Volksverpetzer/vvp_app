import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import ImageModal from "#/components/media/ImageModal";

jest.mock("@likashefqet/react-native-image-zoom", () => ({
  Zoomable: jest.fn(({ children }: any) => children),
}));

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: jest.fn(({ children }: any) => children),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: {
    light: { background: "#ffffff", primary: "#1B7194" },
    dark: { background: "#000000", primary: "#3893C0" },
  },
}));

describe("ImageModal", () => {
  const onClose = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders the close button when visible", () => {
    const { getByText } = render(
      <ImageModal
        uri="https://example.com/img.jpg"
        visible
        onClose={onClose}
      />,
    );
    expect(getByText("Schließen")).toBeTruthy();
  });

  it("calls onClose when close button is pressed", () => {
    const { getByText } = render(
      <ImageModal
        uri="https://example.com/img.jpg"
        visible
        onClose={onClose}
      />,
    );
    fireEvent.press(getByText("Schließen"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
