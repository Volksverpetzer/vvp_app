import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Animated } from "react-native";

import UiTabView from "#/components/ui/UiTabView";

describe("UiTabView", () => {
  it("renders children", () => {
    const { getByText } = render(
      <UiTabView width={200}>
        <Animated.Text>Tab A</Animated.Text>
        <Animated.Text>Tab B</Animated.Text>
      </UiTabView>,
    );
    expect(getByText("Tab A")).toBeTruthy();
    expect(getByText("Tab B")).toBeTruthy();
  });

  it("renders a plain View without a height style when animatedHeight is not provided", () => {
    const { toJSON } = render(
      <UiTabView width={200}>
        <Animated.Text>content</Animated.Text>
      </UiTabView>,
    );
    const root = toJSON() as any;
    expect(root.type).toBe("View");
    const style = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style)
      : root.props.style;
    expect(style.height).toBeUndefined();
  });

  it("applies animatedHeight as the height style when provided", () => {
    const animatedHeight = new Animated.Value(0).interpolate({
      inputRange: [0, 1],
      outputRange: [60, 40],
    });
    const { toJSON } = render(
      <UiTabView width={200} animatedHeight={animatedHeight}>
        <Animated.Text>content</Animated.Text>
      </UiTabView>,
    );
    const root = toJSON() as any;
    const style = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style)
      : root.props.style;
    // toJSON() resolves AnimatedInterpolation to its current numeric value.
    // Value(0) with outputRange [60, 40] deterministically yields 60.
    expect(style.height).toBe(60);
    expect(style.width).toBe(200);
  });

  it("applies pill shape styles", () => {
    const { toJSON } = render(
      <UiTabView width={160}>
        <Animated.Text>content</Animated.Text>
      </UiTabView>,
    );
    const root = toJSON() as any;
    const flatStyle = root.props.style.flat
      ? root.props.style.flat()
      : root.props.style;
    const combined = Object.assign(
      {},
      ...(Array.isArray(flatStyle) ? flatStyle : [flatStyle]),
    );
    expect(combined.borderRadius).toBe(20);
    expect(combined.flexDirection).toBe("row");
    expect(combined.overflow).toBe("hidden");
    expect(combined.width).toBe(160);
  });
});
