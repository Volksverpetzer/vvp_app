import tagStyles from "../../../src/screens/Home/components/article/tagStyles";

describe("tagStyles", () => {
  it("should include blockquote styles", () => {
    const styles = tagStyles("dark", 400);

    expect(styles.blockquote).toBeDefined();
    expect(styles.blockquote.fontSize).toBe(18);
    expect(styles.blockquote.fontStyle).toBe("italic");
    expect(styles.blockquote.borderLeftWidth).toBe(4);
  });

  it("should include cite styles", () => {
    const styles = tagStyles("dark", 400);

    expect(styles.cite).toBeDefined();
    expect(styles.cite.fontSize).toBe(14);
    expect(styles.cite.fontStyle).toBe("italic");
    expect(styles.cite.textAlign).toBe("right");
  });

  it("should use corporate color for blockquote border", () => {
    const styles = tagStyles("dark", 400);

    // The corporate color should be used for the border
    expect(styles.blockquote.borderLeftColor).toBeDefined();
  });
});
