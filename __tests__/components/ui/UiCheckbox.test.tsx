import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import UiCheckbox from "#/components/ui/UiCheckbox";

jest.mock("#/components/Icons", () => ({
  CheckboxIcon: jest.fn(() => null),
}));

describe("UiCheckbox", () => {
  it("renders children", async () => {
    const { getByText } = await render(
      <UiCheckbox checked={false} onChange={jest.fn()}>
        <Text>Accept terms</Text>
      </UiCheckbox>,
    );
    expect(getByText("Accept terms")).toBeTruthy();
  });

  it("has checkbox accessibility role", async () => {
    const { getByRole } = await render(
      <UiCheckbox checked={false} onChange={jest.fn()} />,
    );
    expect(getByRole("checkbox")).toBeTruthy();
  });

  it("reflects initial checked state in accessibility", async () => {
    const { getByRole } = await render(
      <UiCheckbox checked={true} onChange={jest.fn()} />,
    );
    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });

  it("calls onChange with the toggled value when pressed", async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <UiCheckbox checked={false} onChange={onChange} />,
    );
    await fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles from checked to unchecked", async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <UiCheckbox checked={true} onChange={onChange} />,
    );
    await fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("updates accessibility state after parent re-renders with new checked value", async () => {
    const onChange = jest.fn();
    const { getByRole, rerender } = await render(
      <UiCheckbox checked={false} onChange={onChange} />,
    );
    await fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
    await rerender(<UiCheckbox checked={true} onChange={onChange} />);
    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });
});
