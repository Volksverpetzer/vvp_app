import { describe, expect, it } from "@jest/globals";

import { spacing } from "#/constants/Spacing";

// Unlike `radii`, this scale is deliberately NOT a strict arithmetic
// progression — `md` (10) and `xl` (20) are pinned to the app's real
// dominant values rather than being nudged onto an evenly-spaced grid. These
// tests guard the documented shape (ascending, no duplicate steps, the two
// pinned values) so a future edit has to be a deliberate scale change, not
// an accidental collapse.
describe("spacing", () => {
  const steps = ["xs", "sm", "md", "lg", "xl", "xxl", "xxxl", "huge"] as const;

  it("exposes the documented step values", () => {
    expect(spacing).toEqual({
      xs: 4,
      sm: 8,
      md: 10,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 30,
      huge: 40,
    });
  });

  it("keeps the steps strictly ascending with no duplicates", () => {
    const values = steps.map((step) => spacing[step]);
    const ascending = [...values].sort((a, b) => a - b);
    expect(values).toEqual(ascending);
    expect(new Set(values).size).toBe(values.length);
  });

  it("pins md and xl to the app's dominant historic values (10 and 20)", () => {
    expect(spacing.md).toBe(10);
    expect(spacing.xl).toBe(20);
  });
});
