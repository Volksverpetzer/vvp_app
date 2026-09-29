import type { ChildNode, Element } from "domhandler";
import { isTag } from "domhandler";
import { append, removeElement, replaceElement } from "domutils";

/**
 * Handles elements that should be immediately removed
 * @param element The element to check
 * @returns True if the element was handled
 */
export const handleRemovableElements = (element: Element): boolean => {
  // Remove Blockquote Embed Stubs - only remove if it's specifically an embed stub
  // Check for more specific indicators that this is an embed stub rather than a real quote
  if (
    element.tagName === "blockquote" &&
    element.attribs.class?.includes("wp-embedded-content")
  ) {
    // Only remove if it has no meaningful text content or only contains links
    const hasOnlyLinks = element.children.every(
      (child) =>
        !isTag(child) || child.tagName === "a" || child.tagName === "script",
    );
    if (hasOnlyLinks) {
      removeElement(element);
      return true;
    }
  }

  // Remove style elements
  if (element.tagName === "style") {
    removeElement(element);
    return true;
  }

  return false;
};

/**
 * Handles specific element types that need special processing
 * @param element The element to process
 * @returns True if the element was handled
 */
export const handleSpecialElements = (element: Element): boolean => {
  // Handle iframes
  if (element.tagName === "iframe") {
    makeElementRoot(element);
    return true;
  }

  // Handle figcaptions
  if (element.tagName === "figcaption") {
    if (element.parent) {
      append(element.parent, element as unknown as ChildNode);
    }
    return true;
  }

  return false;
};

/**
 * Handles embedded content like YouTube videos and tweets
 * @param element The element to process
 * @returns True if the element was handled
 */
export const handleEmbeddedContent = (element: Element): boolean => {
  // Handle YouTube embeds
  if (element.attribs?.class?.includes("__youtube_prefs__") ?? false) {
    if (element.tagName === "div") {
      element.tagName = "iframe";
      element.attribs = { src: element.attribs["data-facadesrc"] };
      element.children = [];
    } else {
      removeElement(element);
    }
    return true;
  }

  // Handle Twitter embeds
  if (element.attribs.class?.includes("twitter-tweet")) {
    // Keep the blockquote text; don't replace with an iframe.
    return false;
  }

  return false;
};

/**
 * Removes `element`, promoting all of its children — tags AND text nodes —
 * to take its place as siblings, in their original order.
 *
 * domutils' `append(el, next)` inserts `next` immediately after `el` and
 * calls `removeElement(next)` first (unlinking `next` from its current
 * parent's children array). Naively looping `append(element, child)` for
 * each child of `element` therefore has two failure modes seen in the wild
 * on WordPress content with plain-text wrapper divs (e.g. a `<div>label
 * text</div>` with no nested tag): (1) filtering the loop to `isTag(child)`
 * silently drops any text-only child — the div (and its text) simply
 * vanishes when `removeElement(element)` runs after — and (2) repeatedly
 * appending after the same fixed `element` anchor reverses the children's
 * order, since each call re-inserts right after `element` rather than
 * after the previously moved sibling. Snapshotting `children` up front (so
 * the removals during the loop don't shift the array we're iterating) and
 * chaining the anchor forward avoids both.
 */
const unwrapElement = (element: Element): void => {
  const children = [...element.children] as unknown as ChildNode[];
  let anchor: ChildNode = element as unknown as ChildNode;
  for (const child of children) {
    append(anchor, child);
    anchor = child;
  }
  removeElement(element);
};

/**
 * Handles container elements like figures and divs
 * @param element The element to process
 * @returns True if the element was handled
 */
export const handleContainerElements = (element: Element): boolean => {
  // Be more selective about which containers to remove
  // Only remove containers that don't have important styling classes
  if (element.tagName === "figure") {
    // Keep WordPress block images and figures with captions or specific styling
    const hasCaption = element.children.some(
      (child) => isTag(child) && child.tagName === "figcaption",
    );
    const isWordPressBlock =
      element.attribs.class &&
      (element.attribs.class.includes("wp-block-image") ||
        element.attribs.class.includes("wp-block-embed") ||
        element.attribs.class.includes("wp-block"));

    // Keep all WordPress blocks and figures with captions
    if (hasCaption || isWordPressBlock) {
      return false; // Don't remove, let it render normally
    }

    // Only remove simple figure containers without captions or special classes
    unwrapElement(element);
    return true;
  }

  // Be more conservative with div removal - only remove empty or wrapper divs
  if (element.tagName === "div") {
    const hasImportantClass =
      element.attribs.class &&
      (element.attribs.class.includes("wp-block") ||
        element.attribs.class.includes("quote") ||
        element.attribs.class.includes("blockquote") ||
        element.attribs.class.includes("wp-embed"));

    // Keep WordPress blocks and important containers
    if (hasImportantClass) {
      return false; // Don't remove, let it render normally
    }

    // Only remove divs that appear to be simple wrappers with few children
    if (element.children.length <= 2) {
      unwrapElement(element);
      return true;
    }
  }

  return false;
};

/**
 * Handles image elements
 * @param element The element to process
 */
export const handleImageElements = (element: Element): void => {
  if (element.tagName !== "img") return;

  // Check for problematic image sources (blob URLs, invalid URLs)
  const src = element.attribs.src;
  if (src && (src.startsWith("blob:") || src.includes("blob:"))) {
    console.warn("Removing problematic blob image:", src);
    removeElement(element);
    return;
  }

  // Move images out of links and paragraphs
  moveElementIfParentMatches(element, "a");
  moveElementIfParentMatches(element, "p");
};

/**
 * Moves an element up in the DOM if its parent has the specified tag name
 * @param element The element to potentially move
 * @param parentTagName The parent tag name to check for
 */
export const moveElementIfParentMatches = (
  element: Element,
  parentTagName: string,
): void => {
  const parent = element.parent;
  if (!parent || !isTag(parent)) return;

  if (parent.tagName !== parentTagName) return;

  try {
    replaceElement(parent, element);
  } catch (error) {
    console.warn("Error replacing element:", error);
  }
};

/**
 * Moves an element up in the DOM until it is a root element
 * @param element The element to potentially move
 */
export const makeElementRoot = (element: Element): void => {
  const parent = element.parent;
  if (!parent || !isTag(parent)) return;

  try {
    replaceElement(parent, element);
    makeElementRoot(element);
  } catch (error) {
    console.warn("Error replacing element:", error);
  }
};
