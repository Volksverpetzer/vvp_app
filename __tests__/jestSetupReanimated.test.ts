import { describe, expect, it } from "@jest/globals";
import Animated, { Extrapolation, interpolate } from "react-native-reanimated";

describe("global Reanimated mock", () => {
  it("interpolates piecewise over adjacent points", () => {
    // RightAction's opacity range
    const range = [-120, -60, 0];
    const out = [1, 1, 0];
    expect(interpolate(-90, range, out, Extrapolation.CLAMP)).toBe(1);
    expect(interpolate(-60, range, out, Extrapolation.CLAMP)).toBe(1);
    expect(interpolate(-30, range, out, Extrapolation.CLAMP)).toBe(0.5);
    expect(interpolate(0, range, out, Extrapolation.CLAMP)).toBe(0);
  });

  it("clamps or extends outside the input range", () => {
    expect(interpolate(-10, [0, 10], [0, 1], Extrapolation.CLAMP)).toBe(0);
    expect(interpolate(20, [0, 10], [0, 1], Extrapolation.CLAMP)).toBe(1);
    expect(interpolate(20, [0, 10], [0, 1])).toBe(2);
    expect(
      interpolate(20, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    ).toBe(1);
    expect(
      interpolate(-10, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
    ).toBe(-1);
  });

  it("provides the animated components the app renders", () => {
    expect(Animated.View).toBeDefined();
    expect(Animated.ScrollView).toBeDefined();
    expect(Animated.Text).toBeDefined();
    expect(Animated.Image).toBeDefined();
  });
});
