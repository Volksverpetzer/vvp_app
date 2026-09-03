import { decode } from "html-entities";

import WordPressAPI from "#/helpers/network/WordPressAPI";
import { get } from "#/helpers/utils/networking";
import type { HttpsUrl } from "#/types";

export interface OpenGraphPreview {
  title: string;
  description?: string;
  image?: string;
}

const extractMetaContent = (
  html: string,
  property: string,
): string | undefined => {
  // Isolate the whole <meta> tag first so attribute order (content before or
  // after property) doesn't matter, then pull `content` out of just that tag.
  const tag = html.match(
    new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*>`, "i"),
  )?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content) : undefined;
};

/**
 * Fetches `url`'s HTML and extracts its Open Graph title/description/image.
 * Used as a preview for pages that are public but that LoadArticlePost can't
 * fetch through the WordPress REST API — e.g. a "project" custom-post-type
 * page, whose REST route requires authentication even though the page itself
 * doesn't.
 */
export const fetchOpenGraphPreview = async (
  url: HttpsUrl,
  signal?: AbortSignal,
): Promise<OpenGraphPreview | null> => {
  try {
    const html = await get<string>(WordPressAPI.client, url, {
      responseType: "text",
      signal,
    });
    const title = extractMetaContent(html, "title");
    if (!title) return null;
    return {
      title,
      description: extractMetaContent(html, "description"),
      image: extractMetaContent(html, "image"),
    };
  } catch {
    return null;
  }
};
