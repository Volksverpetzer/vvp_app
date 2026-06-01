import { fireEvent, render } from "@testing-library/react-native";
import * as MailComposer from "expo-mail-composer";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { View } from "react-native";

import UiLink from "#/components/ui/UiLink";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("expo-mail-composer", () => ({
  isAvailableAsync: jest.fn(),
  composeAsync: jest.fn(),
}));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("#/components/Icons", () => ({
  ExternalLinkIcon: () => null,
}));
jest.mock("#/components/typography/Heading", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});
jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, onPress, accessibilityRole }: any) => (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      testID="ui-link"
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
    light: { text: "#111", iconMuted: "#888" },
    dark: { text: "#eee", iconMuted: "#444" },
  },
}));
jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { row: {} },
}));

const icon = <View testID="icon" />;

describe("UiLink", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the link text", () => {
    const { getByText } = render(
      <UiLink url="https://example.com" text="Impressum" icon={icon} />,
    );
    expect(getByText("Impressum")).toBeTruthy();
  });

  it("opens browser for https URLs", () => {
    const { getByTestId } = render(
      <UiLink url="https://example.com" text="Link" icon={icon} />,
    );
    fireEvent.press(getByTestId("ui-link"));
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      "https://example.com",
    );
  });

  it("uses MailComposer for mailto URLs when available", async () => {
    jest.mocked(MailComposer.isAvailableAsync).mockResolvedValue(true);
    const { getByTestId } = render(
      <UiLink url="mailto:info@example.com" text="Kontakt" icon={icon} />,
    );
    fireEvent.press(getByTestId("ui-link"));
    await Promise.resolve();
    expect(MailComposer.composeAsync).toHaveBeenCalledWith({
      recipients: ["info@example.com"],
    });
  });

  it("falls back to Linking.openURL for mailto when MailComposer unavailable", async () => {
    const { openURL } = require("expo-linking");
    jest.mocked(MailComposer.isAvailableAsync).mockResolvedValue(false);
    const { getByTestId } = render(
      <UiLink url="mailto:info@example.com" text="Kontakt" icon={icon} />,
    );
    fireEvent.press(getByTestId("ui-link"));
    await Promise.resolve();
    expect(openURL).toHaveBeenCalledWith("mailto:info@example.com");
  });
});
