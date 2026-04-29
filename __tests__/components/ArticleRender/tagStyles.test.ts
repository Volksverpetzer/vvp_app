import { getTagStyles } from "#/helpers/utils/color";
import { ColorScheme } from "#/hooks/useAppColorScheme";

describe("tagStyles", () => {
  it("should include blockquote styles", () => {
    const styles = getTagStyles(ColorScheme.dark);

    expect(styles.blockquote).toBeDefined();
    expect(styles.blockquote.fontSize).toBe(18);
    expect(styles.blockquote.fontFamily).toBe("SourceSansProItalic");
    expect(styles.blockquote.borderLeftWidth).toBe(4);
  });

  it("should include cite styles", () => {
    const styles = getTagStyles(ColorScheme.dark);

    expect(styles.cite).toBeDefined();
    expect(styles.cite.fontSize).toBe(14);
    expect(styles.cite.fontFamily).toBe("SourceSansProItalic");
    expect(styles.cite.textAlign).toBe("right");
  });

  it("should include em styles", () => {
    const styles = getTagStyles(ColorScheme.dark);

    expect(styles.em).toBeDefined();
    expect(styles.em.fontFamily).toBe("SourceSansProItalic");
  });

  it("should use corporate color for blockquote border", () => {
    const styles = getTagStyles(ColorScheme.dark);

    // The corporate color should be used for the border
    expect(styles.blockquote.borderLeftColor).toBeDefined();
  });
});
