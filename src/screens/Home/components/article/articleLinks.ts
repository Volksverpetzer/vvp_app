import { decodeAnchor } from "#/helpers/utils/anchors";
import { normalizeHost } from "#/helpers/utils/host";
import { isHttpsUrl } from "#/helpers/utils/networking";
import type { HttpsUrl } from "#/types";

/** What a tap on a link inside the article body should do. */
export type ArticleLinkAction =
  /** Jump to a header of the current article (decoded id). */
  | { kind: "anchor"; id: string }
  /** A link to the current article itself, without an anchor: do nothing. */
  | { kind: "none" }
  /** mailto: — hand to the OS (mail app). */
  | { kind: "system"; href: string }
  /** Any other web link (http upgraded to https). */
  | { kind: "web"; href: HttpsUrl };

// Only mailto: — articles use it for calls to action (e.g. writing to
// officials); tel: is deliberately left out, no article uses it.
const SYSTEM_SCHEMES = /^mailto:/i;

/**
 * Host (normalized, without `www.` and port) and path (without trailing
 * slashes) of an http(s) URL, or null if it isn't one. Regex-based so it
 * doesn't depend on React Native's partial URL implementation.
 */
const hostAndPath = (url: string): { host: string; path: string } | null => {
  const match = /^https?:\/\/([^/?#]+)([^?#]*)/i.exec(url);
  if (!match) return null;
  const host = normalizeHost(match[1].replace(/^.*@/, "").replace(/:\d+$/, ""));
  return { host, path: match[2].replace(/\/+$/, "") };
};

/** True when `href` points at the same page as `articleLink` (scheme, `www.`, query and fragment ignored). */
const isSameArticle = (href: string, articleLink: string): boolean => {
  const a = hostAndPath(href);
  const b = hostAndPath(articleLink);
  return !!a && !!b && a.host === b.host && a.path === b.path;
};

const fragmentOf = (href: string): string | undefined => {
  const index = href.indexOf("#");
  return index === -1 ? undefined : href.slice(index + 1);
};

/**
 * Decides how a link tapped in the article body is handled.
 *
 * Links to the current article (also written with or without `www.`, http
 * or a trailing slash) and bare `#anchor` links scroll within the article
 * instead of opening it again. `http://` links are upgraded to https, and
 * mailto: is passed to the OS; anything else (incl. tel:) is ignored.
 */
export const classifyArticleLink = (
  href: string,
  articleLink: string,
): ArticleLinkAction | null => {
  if (!href) return null;
  if (href.startsWith("about:///blank#") || isSameArticle(href, articleLink)) {
    const fragment = fragmentOf(href);
    // Fragments in hrefs may be percent-encoded (e.g. a trailing %20),
    // while header ids are raw text — decode once to match.
    return fragment
      ? { kind: "anchor", id: decodeAnchor(fragment) }
      : { kind: "none" };
  }
  if (SYSTEM_SCHEMES.test(href)) return { kind: "system", href };
  const upgraded = href.replace(/^http:\/\//i, "https://");
  if (isHttpsUrl(upgraded)) return { kind: "web", href: upgraded };
  return null;
};
