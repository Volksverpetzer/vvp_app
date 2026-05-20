import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Platform, StyleSheet, Text } from "react-native";

import UiPressable from "#/components/ui/UiPressable";

describe("UiPressable", () => {
  it("renders children", () => {
    const { getByText } = render(
      <UiPressable>
        <Text>child</Text>
      </UiPressable>,
    );
    expect(getByText("child")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <UiPressable onPress={onPress}>
        <Text>press me</Text>
      </UiPressable>,
    );
    fireEvent.press(getByText("press me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("preserves a static style object", () => {
    const style = { backgroundColor: "red", padding: 8 };
    const { toJSON } = render(
      <UiPressable style={style}>
        <Text>child</Text>
      </UiPressable>,
    );
    const root = toJSON() as any;
    const combined = StyleSheet.flatten(root.props.style);
    expect(combined).toMatchObject(style);
  });

  it("calls a style function with the pressed state", () => {
    const styleFn = jest.fn(() => ({ backgroundColor: "blue" }));
    render(
      <UiPressable style={styleFn}>
        <Text>child</Text>
      </UiPressable>,
    );
    expect(styleFn).toHaveBeenCalled();
    expect(styleFn).toHaveBeenCalledWith(
      expect.objectContaining({ pressed: expect.any(Boolean) }),
    );
  });

  it("applies opacity on iOS when pressed", () => {
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    const styleFn = jest.fn(({ pressed }: { pressed: boolean }) => [
      {},
      pressed && { opacity: 0.7 },
    ]);
    render(
      <UiPressable style={styleFn}>
        <Text>child</Text>
      </UiPressable>,
    );
    expect(styleFn).toHaveBeenCalledWith(
      expect.objectContaining({ pressed: false }),
    );
  });
});
