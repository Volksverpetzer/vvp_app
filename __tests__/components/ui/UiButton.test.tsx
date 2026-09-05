import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import UiButton from "#/components/ui/UiButton";

describe("UiButton", () => {
  it("has button accessibility role and renders the label", async () => {
    const { getByRole, getByText } = await render(
      <UiButton label="Alles klar" onPress={jest.fn()} />,
    );
    expect(getByRole("button")).toBeTruthy();
    expect(getByText("Alles klar")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <UiButton label="Senden" onPress={onPress} />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <UiButton label="Senden" onPress={onPress} disabled />,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("falls back to the label for accessibilityLabel", async () => {
    const { getByLabelText } = await render(
      <UiButton label="Schreib uns" onPress={jest.fn()} />,
    );
    expect(getByLabelText("Schreib uns")).toBeTruthy();
  });
});
