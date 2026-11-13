import type { ChildNode, Element } from "domhandler";
import { isTag } from "domhandler";
import { append, prepend, removeElement, replaceElement } from "domutils";

const LEGACY_MESSAGE_TYPES = new Set(["info", "warning", "success", "danger"]);

/**
 * Handles the legacy WPBakery message boxes that the vvp_wp_patches plugin
 * renders as `<div class="vvp-legacy-message vvp-legacy-message--danger">`
 * (from `[vc_message]` shortcodes and from box HTML left in old posts).
 * The website styles them with an inline <style> block and an SVG icon, but
 * the app drops both, and handleContainerElements would unwrap the box
 * div. So:
 *   - the icon div is removed (the app doesn't render inline SVG);
 *   - the content div is unwrapped into the box;
 *   - the box keeps only its two vvp-legacy-message classes, so the
 *     classesStyles from getClassStyles apply and nothing else does.
 * Children are visited before their parent, so the box sees its final
 * children.
 * @param element The element to process
 * @returns True if the element was handled
 */
export const handleLegacyMessageBoxes = (element: Element): boolean => {
  if (element.tagName !== "div") return false;
  const classes = element.attribs.class?.split(/\s+/) ?? [];

  if (classes.includes("vvp-legacy-message__icon")) {
    removeElement(element);
    return true;
  }

  if (classes.includes("vvp-legacy-message__content")) {
    for (const child of element.children) {
      prepend(element as unknown as ChildNode, child);
    }
    removeElement(element);
    return true;
  }

  if (classes.includes("vvp-legacy-message")) {
    const modifier = classes
      .map((name) => /^vvp-legacy-message--(\w+)$/.exec(name)?.[1])
      .find((type) => type !== undefined && LEGACY_MESSAGE_TYPES.has(type));
    element.attribs = {
      class: `vvp-legacy-message vvp-legacy-message--${modifier ?? "info"}`,
    };
    return true;
  }

  return false;
};

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
 * Runs every handler on an article element, in order. Used as the render
 * engine's onElement DOM visitor.
 * @param element The element to process
 */
export const handleArticleElement = (element: Element): void => {
  if (handleEmbeddedContent(element)) return;
  if (handleRemovableElements(element)) return;
  if (handleSpecialElements(element)) return;
  if (handleLegacyMessageBoxes(element)) return;
  if (handleContainerElements(element)) return;
  handleImageElements(element);
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
    for (const child of element.children) {
      if (isTag(child)) {
        append(element, child as unknown as ChildNode);
      }
    }
    removeElement(element);
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
      for (const child of element.children) {
        if (isTag(child)) {
          append(element, child as unknown as ChildNode);
        }
      }
      removeElement(element);
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
