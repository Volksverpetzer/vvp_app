import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import UiEmptyState from "#/components/ui/UiEmptyState";

jest.mock("#/components/ui/UiText", () => {
  const { Text } = require("react-native");
  return jest.fn(({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  ));
});

const Icon = ({ color }: { color?: string }) => (
  <Text testID="icon" style={{ color }}>
    icon
  </Text>
);

describe("UiEmptyState", () => {
  it("renders children as text", () => {
    const { getByText } = render(
      <UiEmptyState icon={<Icon />}>Keine Einträge</UiEmptyState>,
    );
    expect(getByText("Keine Einträge")).toBeTruthy();
  });

  it("renders the icon", () => {
    const { getByTestId } = render(
      <UiEmptyState icon={<Icon />}>text</UiEmptyState>,
    );
    expect(getByTestId("icon")).toBeTruthy();
  });

  it("injects the corporate color into the icon", () => {
    const { getByTestId } = render(
      <UiEmptyState icon={<Icon />}>text</UiEmptyState>,
    );
    const icon = getByTestId("icon");
    expect(icon.props.style).toMatchObject({ color: "#1b7194" });
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <UiEmptyState icon={<Icon />} onPress={onPress}>
        text
      </UiEmptyState>,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not have button role without onPress", () => {
    const { queryByRole } = render(
      <UiEmptyState icon={<Icon />}>text</UiEmptyState>,
    );
    expect(queryByRole("button")).toBeNull();
  });
});
