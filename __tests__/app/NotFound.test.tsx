import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import NotFoundScreen from "#/app/+not-found";

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

jest.mock("#assets/images/404.webp", () => "404-image");

jest.mock("#/components/Icons", () => ({
  ErrorIcon: jest.fn(() => null),
}));

jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));

jest.mock("#/components/views/EmptyComponent", () => {
  const { Text } = require("react-native");
  return jest.fn(({ text }: any) => <Text testID="empty-text">{text}</Text>);
});

jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => (
    <Text testID="heading">{children}</Text>
  ));
});

jest.mock("#/constants/Colors", () => ({
  __esModule: true,
  default: { light: { surface: "#E2F0F5" }, dark: { surface: "#1a1a2e" } },
}));

describe("NotFoundScreen", () => {
  it("renders the 404 heading", async () => {
    const { getByTestId } = await render(<NotFoundScreen />);
    expect(getByTestId("heading").props.children).toBe("404 Whoops!");
  });

  it("renders the error message", async () => {
    const { getByTestId } = await render(<NotFoundScreen />);
    expect(getByTestId("empty-text").props.children).toBe(
      "Die angeforderte Seite konnte nicht gefunden werden.",
    );
  });
});
