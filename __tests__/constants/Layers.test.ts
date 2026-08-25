import { describe, expect, it } from "@jest/globals";

import { layers } from "#/constants/Layers";

describe("layers", () => {
  it("exposes the documented tier values", () => {
    expect(layers).toEqual({
      hidden: -1,
      raised: 1,
      sticky: 100,
    });
  });

  it("keeps hidden below the default stacking order (zIndex 0)", () => {
    expect(layers.hidden).toBeLessThan(0);
  });

  it("keeps sticky (screen-level chrome) above raised (local lifts)", () => {
    // These two tiers are only meaningful relative to each other when a
    // `sticky` element and a `raised` element could ever share a stacking
    // context (e.g. a header sitting above scrolled content) — sticky must
    // stay unambiguously on top.
    expect(layers.sticky).toBeGreaterThan(layers.raised);
  });
});
