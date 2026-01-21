export function normalizeFacets(facets: any): any {
  if (facets === null || facets === undefined) return facets;
  if (!Array.isArray(facets)) return facets;

  const normalizeFacet = (f: any): any => {
    if (f === null || typeof f !== "object") return f;
    const out: any = { ...f };

    // map py_type -> $type and remove py_type
    if (typeof f.py_type !== "undefined") {
      out["$type"] = f.py_type;
    }
    delete out.py_type;

    // normalize index object if present
    if (f.index && typeof f.index === "object") {
      const idxSrc = f.index;
      const idx: any = { ...idxSrc };

      // map py_type -> $type on index
      if (typeof idxSrc.py_type !== "undefined") {
        idx["$type"] = idxSrc.py_type;
      }
      delete idx.py_type;

      // ensure byteStart/byteEnd exist if no camelCase present, then remove snake_case keys
      if (
        typeof idxSrc.byteStart === "undefined" &&
        typeof idxSrc.byte_start !== "undefined"
      ) {
        idx.byteStart = idxSrc.byte_start;
      }
      if (
        typeof idxSrc.byteEnd === "undefined" &&
        typeof idxSrc.byte_end !== "undefined"
      ) {
        idx.byteEnd = idxSrc.byte_end;
      }
      // always remove snake_case keys from output
      delete idx.byte_start;
      delete idx.byte_end;

      out.index = idx;
    }

    // normalize nested features array
    if (Array.isArray(f.features)) {
      out.features = f.features.map((feat: any) => normalizeFacet(feat));
    }

    return out;
  };

  return facets.map((f) => normalizeFacet(f));
}
