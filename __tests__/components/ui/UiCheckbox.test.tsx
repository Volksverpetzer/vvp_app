import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import UiCheckbox from "#/components/ui/UiCheckbox";

jest.mock("#/components/Icons", () => ({
  CheckboxIcon: jest.fn(() => null),
}));

describe("UiCheckbox", () => {
  it("renders children", () => {
    const { getByText } = render(
      <UiCheckbox checked={false} onChange={jest.fn()}>
        <Text>Accept terms</Text>
      </UiCheckbox>,
    );
    expect(getByText("Accept terms")).toBeTruthy();
  });

  it("has checkbox accessibility role", () => {
    const { getByRole } = render(
      <UiCheckbox checked={false} onChange={jest.fn()} />,
    );
    expect(getByRole("checkbox")).toBeTruthy();
  });

  it("reflects initial checked state in accessibility", () => {
    const { getByRole } = render(
      <UiCheckbox checked={true} onChange={jest.fn()} />,
    );
    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });

  it("calls onChange with the toggled value when pressed", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <UiCheckbox checked={false} onChange={onChange} />,
    );
    fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles from checked to unchecked", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <UiCheckbox checked={true} onChange={onChange} />,
    );
    fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("updates accessibility state after parent re-renders with new checked value", () => {
    const onChange = jest.fn();
    const { getByRole, rerender } = render(
      <UiCheckbox checked={false} onChange={onChange} />,
    );
    fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<UiCheckbox checked={true} onChange={onChange} />);
    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });
});
