import type { AppBskyRichtextFacet } from "@atproto/api";

type RawIndex = {
  py_type?: string;
  byteStart?: number;
  byteEnd?: number;
  byte_start?: number;
  byte_end?: number;
};

type RawFacet = {
  py_type?: string;
  index?: RawIndex;
  features?: RawFacet[];
  [key: string]: unknown;
};

const normalizeFacet = (f: RawFacet): AppBskyRichtextFacet.Main => {
  const out: Record<string, unknown> = { ...f };

  if (f.py_type !== undefined) {
    out["$type"] = f.py_type;
  }
  delete out["py_type"];

  if (f.index != null) {
    const idxSrc = f.index;
    const idx: Record<string, unknown> = { ...idxSrc };

    if (idxSrc.py_type !== undefined) {
      idx["$type"] = idxSrc.py_type;
    }
    delete idx["py_type"];

    if (idxSrc.byteStart === undefined && idxSrc.byte_start !== undefined) {
      idx["byteStart"] = idxSrc.byte_start;
    }
    if (idxSrc.byteEnd === undefined && idxSrc.byte_end !== undefined) {
      idx["byteEnd"] = idxSrc.byte_end;
    }
    delete idx["byte_start"];
    delete idx["byte_end"];

    out["index"] = idx;
  }

  if (Array.isArray(f.features)) {
    out["features"] = f.features.map(normalizeFacet);
  }

  return out as unknown as AppBskyRichtextFacet.Main;
};

export function normalizeFacets(
  facets: unknown,
): AppBskyRichtextFacet.Main[] | null | undefined {
  if (facets === null) return null;
  if (facets === undefined) return undefined;
  if (!Array.isArray(facets)) return undefined;
  return (facets as RawFacet[]).map(normalizeFacet);
}

const visualComposerShortcodePattern = /\[\/?vc_[\s\S]*?]/gi;

/**
 * Removes Visual Composer shortcodes from WordPress article HTML/text.
 * Handles opening and closing tags and matches across newlines.
 */
export const stripVisualComposerShortcodes = (content: string) =>
  content.replaceAll(visualComposerShortcodePattern, "");
