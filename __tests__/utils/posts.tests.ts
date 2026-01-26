import { normalizeFacets } from "#/helpers/utils/posts";

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
