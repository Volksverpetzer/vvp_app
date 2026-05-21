import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";

import ShopButton from "#/components/buttons/ShopButton";
import Config from "#/constants/Config";
import { registerEvent } from "#/helpers/network/Analytics";

jest.mock("#/components/ui/UiButton", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ onPress, accessibilityLabel }: any) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    />
  ));
});

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

jest.mock("react-native/Libraries/Linking/Linking", () => ({
  __esModule: true,
  default: { openURL: jest.fn() },
}));

jest.mock("#/helpers/AppImages", () => ({
  AppImages: { shopButton: "shop-button" },
}));

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    donations: {
      shop: "https://shop.volksverpetzer.de",
    },
  },
}));

describe("ShopButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Config as any).donations.shop = "https://shop.volksverpetzer.de";
  });

  it("renders an accessible button when shop URL is configured", () => {
    const { getByRole } = render(<ShopButton />);
    expect(getByRole("button")).toBeTruthy();
  });

  it("returns null when no shop URL is configured", () => {
    (Config as any).donations.shop = undefined;
    const { queryByRole } = render(<ShopButton />);
    expect(queryByRole("button")).toBeNull();
  });

  it("opens the shop URL when pressed", () => {
    const { getByRole } = render(<ShopButton />);
    fireEvent.press(getByRole("button"));
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://shop.volksverpetzer.de",
    );
  });

  it("tracks analytics against article_link when provided", () => {
    const articleLink = "https://www.volksverpetzer.de/artikel/test" as const;
    const { getByRole } = render(<ShopButton article_link={articleLink} />);
    fireEvent.press(getByRole("button"));
    expect(registerEvent).toHaveBeenCalledWith(articleLink, "Shop");
  });

  it("falls back to wpUrl for analytics when article_link is omitted", () => {
    const { getByRole } = render(<ShopButton />);
    fireEvent.press(getByRole("button"));
    expect(registerEvent).toHaveBeenCalledWith(
      "https://www.volksverpetzer.de",
      "Shop",
    );
  });
});
