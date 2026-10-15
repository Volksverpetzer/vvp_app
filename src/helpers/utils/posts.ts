import type { AppBskyRichtextFacet } from "@atproto/api";
import { decode, encode } from "html-entities";

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

/** One page of a WordPress article split at its `[nextpage]` shortcodes. */
export interface ArticlePage {
  /** Title from the shortcode's `title` attribute (decoded), or a fallback. */
  title: string;
  /** The page's HTML, with the shortcode itself removed. */
  html: string;
  /**
   * 1-based page number as the website numbers it (`/slug/2/` is page 2).
   * Usually index + 1, but stays aligned with the website when an empty
   * intro before the first marker is dropped.
   */
  pageNumber: number;
}

/** Title of the content before the first `[nextpage]` marker. */
export const INTRO_PAGE_TITLE = "Einleitung";

// The shortcode as it appears in content.rendered (the multipage plugin
// doesn't expand it in the REST API). `title` may be quoted with straight or
// typographic quotes, raw or as entities.
const nextpagePattern = /\[nextpage\b([^\]]*)\]/gi;
const titleAttributePattern =
  /title\s*=\s*(?:"|'|&quot;|&#0*34;|&#8220;|&#8221;|&#8243;|[“”″])(.*?)(?:"|'|&quot;|&#0*34;|&#8220;|&#8221;|&#8243;|[“”″])\s*$/is;
const trailingBreakPattern = /(?:\s|&nbsp;)*<br\s*\/?>(?:\s|&nbsp;)*$/i;
const trailingParagraphOpenPattern = /<p(?:\s[^>]*)?>(?:\s|&nbsp;)*$/i;
const leadingParagraphClosePattern = /^(?:\s|&nbsp;)*<\/p>/i;
const leadingBreakPattern = /^(?:\s|&nbsp;)*<br\s*\/?>/i;

const parseTitle = (attributes: string, fallback: string) => {
  const match = titleAttributePattern.exec(attributes.trim());
  const title = match ? decode(match[1]).trim() : "";
  return title || fallback;
};

/** True when the HTML has no visible content (only whitespace/empty tags). */
const isBlankHtml = (html: string) =>
  !/<(?:img|iframe|video|audio|figure|embed|object|svg|hr)\b/i.test(html) &&
  decode(html.replaceAll(/<[^>]*>/g, ""))
    .replaceAll(" ", " ")
    .trim() === "";

/**
 * Splits WordPress article HTML at its `[nextpage title="…"]` shortcodes.
 *
 * The marker usually sits in its own paragraph (`<p>[nextpage …]</p>`),
 * sometimes after a `<br>` at the end of one (`…text.<br>[nextpage …]</p>`);
 * both are removed without leaving an empty `<p>` behind. Content before the
 * first marker becomes page 1 ({@link INTRO_PAGE_TITLE}), unless it's empty.
 * Content without markers is returned unchanged as a single page.
 * @param content The (Visual-Composer-stripped) article HTML
 */
export const splitArticlePages = (content: string): ArticlePage[] => {
  const matches = [...content.matchAll(nextpagePattern)];
  if (matches.length === 0) {
    return [{ title: INTRO_PAGE_TITLE, html: content, pageNumber: 1 }];
  }

  // Raw slices between markers, plus the title each slice starts with.
  const slices: { title: string; html: string }[] = [];
  let cursor = 0;
  let title = INTRO_PAGE_TITLE;
  for (const [index, match] of matches.entries()) {
    slices.push({ title, html: content.slice(cursor, match.index) });
    cursor = match.index + match[0].length;
    title = parseTitle(match[1], `Seite ${index + 2}`);
  }
  slices.push({ title, html: content.slice(cursor) });

  // Repair the paragraph each marker was cut out of.
  for (let index = 0; index < slices.length - 1; index++) {
    const before = slices[index];
    const after = slices[index + 1];
    before.html = before.html.replace(trailingBreakPattern, "");
    const openParagraph = trailingParagraphOpenPattern.exec(before.html);
    if (openParagraph) {
      // `<p>[nextpage]…`: the paragraph belongs to the next page entirely.
      before.html = before.html.slice(0, openParagraph.index);
      after.html = leadingParagraphClosePattern.test(after.html)
        ? after.html.replace(leadingParagraphClosePattern, "")
        : openParagraph[0] + after.html.replace(leadingBreakPattern, "");
    } else if (leadingParagraphClosePattern.test(after.html)) {
      // `…text.<br>[nextpage]</p>`: the paragraph closes on this page.
      after.html = after.html.replace(leadingParagraphClosePattern, "");
      before.html += "</p>";
    }
  }

  const pages = slices.map((slice, index) => ({
    title: slice.title,
    html: slice.html,
    pageNumber: index + 1,
  }));
  // An empty intro (article starting with a marker) isn't worth a page.
  return isBlankHtml(pages[0].html) ? pages.slice(1) : pages;
};

/**
 * Index of the page whose HTML contains an element with the given id, or -1.
 * @param pages The article's pages
 * @param id The decoded HTML id (e.g. a deep-link fragment)
 */
export const findPageIndexForAnchor = (pages: ArticlePage[], id: string) => {
  if (!id) return -1;
  const candidates = new Set([id, encode(id)]);
  return pages.findIndex((page) =>
    [...candidates].some(
      (candidate) =>
        page.html.includes(`id="${candidate}"`) ||
        page.html.includes(`id='${candidate}'`),
    ),
  );
};

/**
 * Index of the page with the given website page number (from a `/slug/N/`
 * URL), or -1 when the article has no such page.
 */
export const findPageIndexForPageNumber = (
  pages: ArticlePage[],
  pageNumber: number,
) => pages.findIndex((page) => page.pageNumber === pageNumber);

/**
 * The website page number a link to one of the article's own paged URLs
 * (`{article_link}3/`, as the multipage plugin links them) points to, plus
 * its fragment, if any. Undefined for any other URL.
 * @param href The tapped or deep-linked URL
 * @param articleLink The article's own (trailing-slash) permalink
 */
export const parseArticlePageLink = (
  href: string,
  articleLink: string,
): { pageNumber: number; anchor?: string } | undefined => {
  const base = articleLink.replace(/\/+$/, "") + "/";
  if (!href.startsWith(base)) return undefined;
  const match = /^(\d+)\/?(?:\?[^#]*)?(?:#(.*))?$/.exec(
    href.slice(base.length),
  );
  if (!match) return undefined;
  const pageNumber = Number(match[1]);
  if (pageNumber < 1) return undefined;
  return match[2] ? { pageNumber, anchor: match[2] } : { pageNumber };
};
