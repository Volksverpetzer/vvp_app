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
  it("renders children as text", async () => {
    const { getByText } = await render(
      <UiEmptyState icon={<Icon />}>Keine Einträge</UiEmptyState>,
    );
    expect(getByText("Keine Einträge")).toBeTruthy();
  });

  it("renders the icon", async () => {
    const { getByTestId } = await render(
      <UiEmptyState icon={<Icon />}>text</UiEmptyState>,
    );
    expect(getByTestId("icon")).toBeTruthy();
  });

  it("injects the corporate color into the icon when no color is set", async () => {
    const { getByTestId } = await render(
      <UiEmptyState icon={<Icon />}>text</UiEmptyState>,
    );
    const icon = getByTestId("icon");
    expect(icon.props.style).toMatchObject({ color: "#1b7194" });
  });

  it("preserves an explicit color passed by the caller", async () => {
    const { getByTestId } = await render(
      <UiEmptyState icon={<Icon color="red" />}>text</UiEmptyState>,
    );
    const icon = getByTestId("icon");
    expect(icon.props.style).toMatchObject({ color: "red" });
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <UiEmptyState icon={<Icon />} onPress={onPress}>
        text
      </UiEmptyState>,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not have button role without onPress", async () => {
    const { queryByRole } = await render(
      <UiEmptyState icon={<Icon />}>text</UiEmptyState>,
    );
    expect(queryByRole("button")).toBeNull();
  });
});
