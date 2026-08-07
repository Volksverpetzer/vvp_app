import { describe, expect, it } from "@jest/globals";

import { radii } from "#/constants/BorderRadius";

// The scale is a design contract, not just a bag of numbers: layouts across the
// app assume the steps stay ordered and evenly spaced. These guard that shape,
// so a future "just nudge one token" edit has to be deliberate.
describe("radii", () => {
  const steps = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;

  it("exposes the documented step values", () => {
    expect(radii).toEqual({
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      full: 9999,
    });
  });

  it("keeps the steps strictly ascending", () => {
    const values = steps.map((step) => radii[step]);
    const ascending = [...values].sort((a, b) => a - b);
    expect(values).toEqual(ascending);
    expect(new Set(values).size).toBe(values.length);
  });

  it("keeps the steps on an arithmetic +4 progression", () => {
    const values = steps.map((step) => radii[step]);
    for (let index = 1; index < values.length; index++) {
      expect(values[index] - values[index - 1]).toBe(4);
    }
  });

  it("keeps `full` far above the largest step so it always reads as a pill", () => {
    // A pill radius only works if it exceeds half the height of anything it is
    // applied to; a value near the scale would silently become a corner radius.
    expect(radii.full).toBeGreaterThan(radii.xxl * 100);
  });
});
