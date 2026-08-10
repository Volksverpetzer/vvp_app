import { describe, expect, it } from "@jest/globals";

import { MIN_TOUCH_TARGET, iconSizes } from "#/constants/IconSizes";

describe("iconSizes", () => {
  const steps = ["xs", "sm", "md", "lg", "xl"] as const;

  it("exposes the documented step values", () => {
    expect(iconSizes).toEqual({
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 56,
    });
  });

  it("keeps the steps strictly ascending with no duplicates", () => {
    const values = steps.map((step) => iconSizes[step]);
    const ascending = [...values].sort((a, b) => a - b);
    expect(values).toEqual(ascending);
    expect(new Set(values).size).toBe(values.length);
  });

  it("pins md to the app's dominant historic icon size (24)", () => {
    expect(iconSizes.md).toBe(24);
  });
});

describe("MIN_TOUCH_TARGET", () => {
  it("matches Apple HIG / Material minimum touch target guidance", () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });

  it("is reachable from every small/default icon step with a non-negative hitSlop", () => {
    // hitSlop pads a pressable's hit area on top of the icon's own size — it
    // can only add, not subtract, so a step needing hitSlop to reach the
    // minimum must already be at or below it. `xl` (56) is a hero-icon size
    // that exceeds the target on its own and is exempt from this rule.
    for (const step of ["xs", "sm", "md", "lg"] as const) {
      expect(iconSizes[step]).toBeLessThanOrEqual(MIN_TOUCH_TARGET);
    }
    expect(iconSizes.xl).toBeGreaterThan(MIN_TOUCH_TARGET);
  });
});
