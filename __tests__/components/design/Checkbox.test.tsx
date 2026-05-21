import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import Checkbox from "#/components/design/Checkbox";

jest.mock("#/components/Icons", () => ({
  CheckboxIcon: jest.fn(() => null),
}));

describe("Checkbox", () => {
  it("renders children", () => {
    const { getByText } = render(
      <Checkbox checked={false} onChange={jest.fn()}>
        <Text>Accept terms</Text>
      </Checkbox>,
    );
    expect(getByText("Accept terms")).toBeTruthy();
  });

  it("has checkbox accessibility role", () => {
    const { getByRole } = render(
      <Checkbox checked={false} onChange={jest.fn()} />,
    );
    expect(getByRole("checkbox")).toBeTruthy();
  });

  it("reflects initial checked state in accessibility", () => {
    const { getByRole } = render(
      <Checkbox checked={true} onChange={jest.fn()} />,
    );
    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });

  it("calls onChange with the toggled value when pressed", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <Checkbox checked={false} onChange={onChange} />,
    );
    fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles from checked to unchecked", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <Checkbox checked={true} onChange={onChange} />,
    );
    fireEvent.press(getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("updates accessibility state after toggle", () => {
    const { getByRole } = render(
      <Checkbox checked={false} onChange={jest.fn()} />,
    );
    fireEvent.press(getByRole("checkbox"));
    expect(getByRole("checkbox", { checked: true })).toBeTruthy();
  });
});
