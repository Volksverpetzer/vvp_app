import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import UiButton from "#/components/ui/UiButton";

jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
}));

describe("UiButton", () => {
  const source = { uri: "https://example.com/button.png" };

  it("has button accessibility role", async () => {
    const { getByRole } = await render(
      <UiButton source={source} onPress={jest.fn()} />,
    );
    expect(getByRole("button")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <UiButton source={source} onPress={onPress} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes accessibilityLabel", async () => {
    const { getByLabelText } = await render(
      <UiButton
        source={source}
        onPress={jest.fn()}
        accessibilityLabel="Donate via PayPal"
      />,
    );
    expect(getByLabelText("Donate via PayPal")).toBeTruthy();
  });
});
