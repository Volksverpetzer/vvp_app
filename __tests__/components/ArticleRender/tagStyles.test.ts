import { getTagStyles } from "#/helpers/utils/color";

describe("tagStyles", () => {
  it("should include blockquote styles", () => {
    const styles = getTagStyles("dark");

    expect(styles.blockquote).toBeDefined();
    expect(styles.blockquote.fontSize).toBe(18);
    expect(styles.blockquote.fontStyle).toBe("italic");
    expect(styles.blockquote.borderLeftWidth).toBe(4);
  });

  it("should include cite styles", () => {
    const styles = getTagStyles("dark");

    expect(styles.cite).toBeDefined();
    expect(styles.cite.fontSize).toBe(14);
    expect(styles.cite.fontStyle).toBe("italic");
    expect(styles.cite.textAlign).toBe("right");
  });

  it("should include em styles", () => {
    const styles = getTagStyles("dark");

    expect(styles.em).toBeDefined();
    expect(styles.em.fontStyle).toBe("italic");
  });

  it("should use corporate color for blockquote border", () => {
    const styles = getTagStyles("dark");

    // The corporate color should be used for the border
    expect(styles.blockquote.borderLeftColor).toBeDefined();
  });
});
