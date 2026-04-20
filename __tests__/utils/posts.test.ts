import {
  normalizeFacets,
  stripVisualComposerShortcodes,
} from "#/helpers/utils/posts";

describe("normalizeFacets", () => {
  test("returns falsy values unchanged", () => {
    expect(normalizeFacets(null)).toBeNull();
    expect(normalizeFacets(undefined)).toBeUndefined();
  });

  test("returns non-array input unchanged", () => {
    const obj = { some: "value" };
    expect(normalizeFacets(obj)).toBe(obj);
  });

  test("maps facet py_type to $type and removes py_type", () => {
    const input = [{ py_type: "facetType", other: 1 }];
    const out = normalizeFacets(input);
    expect(Array.isArray(out)).toBeTruthy();
    expect(out[0]["$type"]).toBe("facetType");
    expect(out[0].py_type).toBeUndefined();
    // original input must not be mutated
    expect(input[0].py_type).toBe("facetType");
  });

  test("normalizes index: py_type -> $type and byte_start/byte_end -> byteStart/byteEnd", () => {
    const input = [
      {
        py_type: "facetType",
        index: {
          py_type: "indexType",
          byte_start: 2,
          byte_end: 5,
        },
      },
    ];
    const out = normalizeFacets(input);
    const idx = out[0].index;
    expect(idx["$type"]).toBe("indexType");
    expect(idx.byteStart).toBe(2);
    expect(idx.byteEnd).toBe(5);
    expect(idx.py_type).toBeUndefined();
    expect(idx.byte_start).toBeUndefined();
    expect(idx.byte_end).toBeUndefined();
    // original index remains unchanged
    expect(input[0].index.py_type).toBe("indexType");
    expect(input[0].index.byte_start).toBe(2);
  });

  test("normalizes features and nested feature index", () => {
    const input = [
      {
        py_type: "facetType",
        features: [
          {
            py_type: "featType",
            index: {
              py_type: "featureIndex",
              byte_start: 10,
              byte_end: 15,
            },
          },
        ],
      },
    ];

    const out = normalizeFacets(input);
    const feat = out[0].features[0];
    expect(feat["$type"]).toBe("featType");
    expect(feat.py_type).toBeUndefined();

    const featureIndex = feat.index;
    expect(featureIndex["$type"]).toBe("featureIndex");
    expect(featureIndex.byteStart).toBe(10);
    expect(featureIndex.byteEnd).toBe(15);
    expect(featureIndex.py_type).toBeUndefined();
    expect(featureIndex.byte_start).toBeUndefined();
    expect(featureIndex.byte_end).toBeUndefined();

    // original feature/index should still have original keys
    expect(input[0].features[0].py_type).toBe("featType");
    expect(input[0].features[0].index.byte_start).toBe(10);
  });

  test("returns empty array for empty array input", () => {
    expect(normalizeFacets([])).toEqual([]);
  });

  test("facet without py_type has no $type key", () => {
    const input = [{ other: "value" }];
    const out = normalizeFacets(input);
    expect(out[0]).not.toHaveProperty("$type");
    expect(out[0].other).toBe("value");
  });

  test("facet without index has no index key in output", () => {
    const input = [{ py_type: "t", other: 42 }];
    const out = normalizeFacets(input);
    expect(out[0]).not.toHaveProperty("index");
    expect(out[0]["$type"]).toBe("t");
    expect(out[0].other).toBe(42);
  });

  test("does not overwrite existing byteStart/byteEnd", () => {
    const input = [
      {
        index: {
          byte_start: 1,
          byteStart: 99,
          byte_end: 2,
          byteEnd: 100,
        },
      },
    ];
    const out = normalizeFacets(input);
    const idx = out[0].index;
    // existing byteStart/byteEnd kept, byte_start/byte_end removed
    expect(idx.byteStart).toBe(99);
    expect(idx.byteEnd).toBe(100);
    expect(idx.byte_start).toBeUndefined();
    expect(idx.byte_end).toBeUndefined();
  });
});

describe("stripVisualComposerShortcodes", () => {
  test("removes Visual Composer opening, closing, and nested shortcodes while preserving content", () => {
    const input = `
      <p>Intro paragraph.</p>
      [vc_row]
        [vc_column width="1/2"]
          <p>Left column text.</p>
          [vc_custom_heading text="Headline"]
        [/vc_column]
        [vc_column width="1/2"]
          <p>Right column text.</p>
        [/vc_column]
      [/vc_row]
      <p>Outro paragraph.</p>
    `;

    const output = stripVisualComposerShortcodes(input);

    expect(output).toContain("<p>Intro paragraph.</p>");
    expect(output).toContain("<p>Left column text.</p>");
    expect(output).toContain("<p>Right column text.</p>");
    expect(output).toContain("<p>Outro paragraph.</p>");
    expect(output).not.toMatch(/\[\/?vc_[\s\S]*?]/i);
  });

  test("handles shortcode tags split across lines", () => {
    const input = `[vc_column
      width="1/1"
      el_class="hero"
    ]Body[/vc_column]`;

    expect(stripVisualComposerShortcodes(input)).toBe("Body");
  });

  test("returns empty string unchanged", () => {
    expect(stripVisualComposerShortcodes("")).toBe("");
  });

  test("removes uppercase VC_ shortcodes (case-insensitive)", () => {
    expect(stripVisualComposerShortcodes("[VC_ROW]Body[/VC_ROW]")).toBe("Body");
  });

  test("returns content without Visual Composer shortcodes unchanged", () => {
    const input = "<p>Plain article content only.</p>";

    expect(stripVisualComposerShortcodes(input)).toBe(input);
  });

  test("does not remove non-Visual-Composer shortcodes", () => {
    const input = `
      <p>Intro</p>
      [gallery ids="1,2,3"]
      [video src="https://example.com/video.mp4"][/video]
      [vc_row][vc_column]Body[/vc_column][/vc_row]
    `;

    const output = stripVisualComposerShortcodes(input);

    expect(output).toContain('[gallery ids="1,2,3"]');
    expect(output).toContain(
      '[video src="https://example.com/video.mp4"][/video]',
    );
    expect(output).toContain("Body");
    expect(output).not.toMatch(/\[\/?vc_[\s\S]*?]/i);
  });
});
