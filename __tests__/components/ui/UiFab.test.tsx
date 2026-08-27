import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import UiFab from "#/components/ui/UiFab";

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

describe("UiFab", () => {
  it("renders children and an accessible button role", async () => {
    const { getByRole, getByText } = await render(
      <UiFab onPress={jest.fn()}>
        <Text>x</Text>
      </UiFab>,
    );
    expect(getByRole("button")).toBeTruthy();
    expect(getByText("x")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <UiFab onPress={onPress}>
        <Text>x</Text>
      </UiFab>,
    );
    await fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("defaults to a 48px diameter with a matching border radius", async () => {
    const { getByRole } = await render(
      <UiFab onPress={jest.fn()}>
        <Text>x</Text>
      </UiFab>,
    );
    const style = flatten(getByRole("button").props.style);
    expect(style.width).toBe(48);
    expect(style.height).toBe(48);
    expect(style.borderRadius).toBe(24);
  });

  it("derives the border radius from a custom size", async () => {
    const { getByRole } = await render(
      <UiFab onPress={jest.fn()} size={80}>
        <Text>x</Text>
      </UiFab>,
    );
    const style = flatten(getByRole("button").props.style);
    expect(style.width).toBe(80);
    expect(style.height).toBe(80);
    expect(style.borderRadius).toBe(40);
  });

  it("exposes accessibilityLabel", async () => {
    const { getByLabelText } = await render(
      <UiFab onPress={jest.fn()} accessibilityLabel="Zurück nach oben">
        <Text>x</Text>
      </UiFab>,
    );
    expect(getByLabelText("Zurück nach oben")).toBeTruthy();
  });
});
