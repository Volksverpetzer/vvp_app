import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";

import SteadyButton from "#/components/buttons/SteadyButton";
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

jest.mock("#assets/images/button_steady.webp", () => "steady-button");

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    donations: { steady: "https://steadyhq.com/de/volksverpetzer" },
  },
}));

describe("SteadyButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an accessible button", async () => {
    const { getByRole } = await render(<SteadyButton />);
    expect(getByRole("button")).toBeTruthy();
  });

  it("opens the Steady URL when pressed", async () => {
    const { getByRole } = await render(<SteadyButton />);
    await fireEvent.press(getByRole("button"));
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://steadyhq.com/de/volksverpetzer",
    );
  });

  it("tracks analytics against article_link when provided", async () => {
    const articleLink = "https://www.volksverpetzer.de/artikel/test" as const;
    const { getByRole } = await render(
      <SteadyButton article_link={articleLink} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(registerEvent).toHaveBeenCalledWith(articleLink, "Steady");
  });

  it("falls back to wpUrl for analytics when article_link is omitted", async () => {
    const { getByRole } = await render(<SteadyButton />);
    await fireEvent.press(getByRole("button"));
    expect(registerEvent).toHaveBeenCalledWith(
      "https://www.volksverpetzer.de",
      "Steady",
    );
  });
});
