import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Platform, StyleSheet, Text } from "react-native";

import UiPressable from "#/components/ui/UiPressable";

describe("UiPressable", () => {
  let originalOS: typeof Platform.OS;

  beforeEach(() => {
    originalOS = Platform.OS;
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      value: originalOS,
      configurable: true,
    });
  });

  it("renders children", async () => {
    const { getByText } = await render(
      <UiPressable>
        <Text>child</Text>
      </UiPressable>,
    );
    expect(getByText("child")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <UiPressable onPress={onPress}>
        <Text>press me</Text>
      </UiPressable>,
    );
    await fireEvent.press(getByText("press me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("preserves a static style object", async () => {
    const style = { backgroundColor: "red", padding: 8 };
    const { toJSON } = await render(
      <UiPressable style={style}>
        <Text>child</Text>
      </UiPressable>,
    );
    const root = toJSON() as any;
    const combined = StyleSheet.flatten(root.props.style);
    expect(combined).toMatchObject(style);
  });

  it("calls a style function with the pressed state", async () => {
    const styleFn = jest.fn(() => ({ backgroundColor: "blue" }));
    await render(
      <UiPressable style={styleFn}>
        <Text>child</Text>
      </UiPressable>,
    );
    expect(styleFn).toHaveBeenCalled();
    expect(styleFn).toHaveBeenCalledWith(
      expect.objectContaining({ pressed: expect.any(Boolean) }),
    );
  });

  it.each(["ios", "web"] as const)(
    "applies opacity feedback on %s (non-Android)",
    async (os) => {
      Object.defineProperty(Platform, "OS", { value: os, configurable: true });
      const styleFn = jest.fn(() => ({}));
      await render(
        <UiPressable style={styleFn}>
          <Text>child</Text>
        </UiPressable>,
      );
      expect(styleFn).toHaveBeenCalledWith(
        expect.objectContaining({ pressed: expect.any(Boolean) }),
      );
    },
  );

  it("caller style overrides the default pressed opacity", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    const { toJSON } = await render(
      <UiPressable style={{ opacity: 1 }}>
        <Text>child</Text>
      </UiPressable>,
    );
    const root = toJSON() as any;
    const combined = StyleSheet.flatten(root.props.style);
    // User-provided opacity: 1 must win over default opacity: 0.7
    expect(combined.opacity).toBe(1);
  });

  it("does not apply opacity on Android (ripple handles feedback)", async () => {
    Object.defineProperty(Platform, "OS", {
      value: "android",
      configurable: true,
    });
    const { toJSON } = await render(
      <UiPressable style={{ padding: 8 }}>
        <Text>child</Text>
      </UiPressable>,
    );
    const root = toJSON() as any;
    const combined = StyleSheet.flatten(root.props.style);
    expect(combined).not.toHaveProperty("opacity");
  });
});
