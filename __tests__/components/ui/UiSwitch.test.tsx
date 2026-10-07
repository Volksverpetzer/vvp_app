import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Platform, StyleSheet } from "react-native";

import UiSwitch from "#/components/ui/UiSwitch";
import { spacing } from "#/constants/Spacing";

const renderSwitch = (onValueChange = jest.fn()) =>
  render(
    <UiSwitch testID="switch" value={false} onValueChange={onValueChange} />,
  );

describe("UiSwitch", () => {
  it("calls onValueChange when toggled", async () => {
    const onValueChange = jest.fn();
    const { getByTestId } = await renderSwitch(onValueChange);

    await fireEvent(getByTestId("switch"), "valueChange", true);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("cancels the native inset on Android", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "android");
    const { getByTestId } = await renderSwitch();

    expect(StyleSheet.flatten(getByTestId("switch").props.style)).toEqual(
      expect.objectContaining({ marginRight: -spacing.md }),
    );
    platform.restore();
  });

  it("has no inset on iOS", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "ios");
    const { getByTestId } = await renderSwitch();

    expect(
      StyleSheet.flatten(getByTestId("switch").props.style).marginRight,
    ).toBeUndefined();
    platform.restore();
  });
});
