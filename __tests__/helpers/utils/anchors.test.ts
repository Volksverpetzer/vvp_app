import { decodeAnchor } from "#/helpers/utils/anchors";

describe("decodeAnchor", () => {
  it("returns plain fragments unchanged", () => {
    expect(decodeAnchor("quellen")).toBe("quellen");
  });

  it("decodes percent-encoded fragments once", () => {
    // Real-world case: WordPress ids with a trailing encoded space.
    expect(decodeAnchor("die-quellen%20")).toBe("die-quellen ");
    expect(decodeAnchor("%C3%A4")).toBe("ä");
  });

  it("returns invalid percent-encoding unchanged instead of throwing", () => {
    expect(decodeAnchor("50%-rabatt")).toBe("50%-rabatt");
  });
});
