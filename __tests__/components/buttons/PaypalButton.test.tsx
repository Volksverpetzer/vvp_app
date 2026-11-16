import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";

import PaypalButton from "#/components/buttons/PaypalButton";
import NotificationManager from "#/helpers/Notifications";
import { registerEvent } from "#/helpers/network/Analytics";

jest.mock("#/components/ui/UiButton", () => {
  const { Pressable } = require("react-native");
  return jest.fn(({ onPress, accessibilityLabel, accessibilityHint }: any) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
    />
  ));
});

jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: jest.fn(),
}));

jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: { scheduleDonationReminder: jest.fn() },
}));

jest.mock("react-native/Libraries/Linking/Linking", () => ({
  __esModule: true,
  default: { openURL: jest.fn(() => Promise.resolve()) },
}));

jest.mock("#assets/images/button_paypal.webp", () => "paypal-button");

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    wpUrl: "https://www.volksverpetzer.de",
    donations: {
      paypal: "https://paypal.example/default",
      paypalMatrix: [{ amount: 50, url: "https://paypal.example/50" }],
    },
  },
}));

describe("PaypalButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the PayPal URL for the selected amount", async () => {
    const { getByRole } = await render(<PaypalButton amount={50} />);
    await fireEvent.press(getByRole("button"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://paypal.example/50");
  });

  it("falls back to the default PayPal URL for unknown amounts", async () => {
    const { getByRole } = await render(<PaypalButton amount={7} />);
    await fireEvent.press(getByRole("button"));
    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://paypal.example/default",
    );
  });

  it("tracks a click, not a donation conversion", async () => {
    const articleLink = "https://www.volksverpetzer.de/artikel/test" as const;
    const { getByRole } = await render(
      <PaypalButton amount={50} article_link={articleLink} />,
    );
    await fireEvent.press(getByRole("button"));
    await Promise.resolve();

    expect(registerEvent).toHaveBeenCalledWith(articleLink, "Paypal", {
      amount: 50,
    });
    expect(registerEvent).not.toHaveBeenCalledWith(
      expect.anything(),
      "DonateConversion",
      expect.anything(),
    );
    expect(NotificationManager.scheduleDonationReminder).not.toHaveBeenCalled();
  });

  it("does not throw when the browser cannot be opened", async () => {
    (Linking.openURL as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("no browser")),
    );
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { getByRole } = await render(<PaypalButton amount={10} />);
    await fireEvent.press(getByRole("button"));
    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
