import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Platform } from "react-native";

import Donate from "#/components/views/Donate";

const DONATE_URL = `${require("expo-constants").default.expoConfig.extra.wpUrl}/app`;

// Apple Pay is only offered on iOS with platformPay enabled.
jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    donations: { platformPay: true, paypalMatrix: [{ amount: 10 }] },
  },
}));
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));

const mockRegisterEvent = jest.fn();
jest.mock("#/helpers/network/Analytics", () => ({
  registerEvent: (...args: unknown[]) => mockRegisterEvent(...args),
}));
jest.mock("#/helpers/Notifications", () => ({
  __esModule: true,
  default: { scheduleDonationReminder: jest.fn(() => Promise.resolve()) },
}));

jest.mock("#/components/animations/AnimatedSuccess", () => () => null);
jest.mock("#/components/buttons/PaypalButton", () => () => null);
jest.mock("#/components/buttons/SteadyButton", () => () => null);
jest.mock("#/components/buttons/ShopButton", () => () => null);
jest.mock("expo-linear-gradient", () => ({ LinearGradient: () => null }));

// Stand-in for the Apple Pay button: exposes its start and success callbacks.
jest.mock("#/components/buttons/StripeButton", () => {
  const { Text } = require("react-native");
  return function MockStripeButton({
    onStart,
    onSuccess,
  }: {
    onStart?: () => void;
    onSuccess: () => void;
  }) {
    return (
      <>
        <Text onPress={onStart}>start payment</Text>
        <Text onPress={onSuccess}>finish payment</Text>
      </>
    );
  };
});

describe("Donate analytics", () => {
  beforeEach(() => {
    mockRegisterEvent.mockClear();
    Platform.OS = "ios";
  });

  it("sends Donate Started when the Apple Pay button is tapped", async () => {
    const { getByText } = await render(<Donate />);

    await fireEvent.press(getByText("start payment"));

    expect(mockRegisterEvent).toHaveBeenCalledTimes(1);
    expect(mockRegisterEvent).toHaveBeenCalledWith(
      DONATE_URL,
      "Donate Started",
      { method: "Stripe", amount: 10 },
    );
  });

  it("sends DonateConversion with the same URL and props on success", async () => {
    const { getByText } = await render(<Donate />);

    await fireEvent.press(getByText("start payment"));
    await fireEvent.press(getByText("finish payment"));

    expect(mockRegisterEvent.mock.calls).toEqual([
      [DONATE_URL, "Donate Started", { method: "Stripe", amount: 10 }],
      [DONATE_URL, "DonateConversion", { method: "Stripe", amount: 10 }],
    ]);
  });
});
