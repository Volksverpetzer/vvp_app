import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import ContactCard from "#/components/views/ContactCard";
import type { HttpsUrl } from "#/types";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: jest.fn(() => "light"),
}));

jest.mock("#/constants/Colors", () => ({
  light: { accent: "#e63312", text: "#000" },
}));

jest.mock("#/constants/GlobalStyles", () => ({
  globalStyles: { whiteText: {} },
}));

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children }: any) => <Text>{children}</Text>);
});

jest.mock("#/components/ui/UiPressable", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ children, ...props }: any) => (
    <Pressable {...props}>{children}</Pressable>
  ));
});

describe("ContactCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the contact tab with the article url prefilled", async () => {
    const articleLink = "https://example.com/artikel" as HttpsUrl;
    const { getByText } = await render(
      <ContactCard article_link={articleLink} />,
    );

    await fireEvent.press(getByText("Schreib uns"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/contact",
      params: { category: "app_feedback", url: articleLink },
    });
  });
});
