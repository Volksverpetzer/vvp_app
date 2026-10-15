import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React, { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";

import PaypalButton from "#/components/buttons/PaypalButton";
import Donate from "#/components/views/Donate";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: {
    donations: {
      platformPay: false,
      paypalMatrix: [{ amount: 5 }, { amount: 10 }, { amount: 20 }],
    },
  },
}));
jest.mock("#/hooks/useAppColorScheme", () => ({
  useAppColorScheme: () => "light",
}));
jest.mock("#/components/animations/AnimatedSuccess", () => () => null);
jest.mock("#/components/buttons/PaypalButton", () => jest.fn(() => null));
jest.mock("#/components/buttons/StripeButton", () => () => null);
jest.mock("#/components/buttons/SteadyButton", () => () => null);
jest.mock("#/components/buttons/ShopButton", () => () => null);
jest.mock("expo-linear-gradient", () => ({ LinearGradient: () => null }));

const MockPaypalButton = PaypalButton as unknown as jest.Mock<
  (properties: { amount: number }) => null
>;
const lastPaypalAmount = () => MockPaypalButton.mock.calls.at(-1)[0].amount;

// The test renderer has no native ScrollView to scroll, so stand in for it
// with a View that exposes a mock scrollTo through the ref
const mockScrollTo = jest.fn();
const MockScrollView = forwardRef(function MockScrollView(
  properties: any,
  reference,
) {
  useImperativeHandle(reference, () => ({ scrollTo: mockScrollTo }));
  return <View testID="amount-picker" {...properties} />;
});

describe("Donate amount picker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on the module object itself; Donate reads ScrollView off it at
    // render time, while an `import * as` namespace would be a copy
    jest
      .spyOn(
        require("react-native") as { ScrollView: unknown },
        "ScrollView",
        "get",
      )
      .mockReturnValue(MockScrollView as any);
  });

  it("renders one entry per configured amount", async () => {
    const { getByText } = await render(<Donate />);
    expect(getByText("5€")).toBeTruthy();
    expect(getByText("10€")).toBeTruthy();
    expect(getByText("20€")).toBeTruthy();
  });

  it("scrolls to the default amount once the picker is measured", async () => {
    const { getByTestId } = await render(<Donate />);

    await fireEvent(getByTestId("amount-picker").parent, "layout", {
      nativeEvent: { layout: { width: 320 } },
    });

    // Default amount is 10€, the second entry, and each entry is 80 wide
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 80, animated: false });
  });

  it("selects the amount the picker snaps to", async () => {
    const { getByTestId } = await render(<Donate />);
    expect(lastPaypalAmount()).toBe(10);

    await fireEvent(getByTestId("amount-picker"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: 160 } },
    });

    expect(lastPaypalAmount()).toBe(20);
  });
});
