import type { ChildNode } from "domhandler";
import { Node } from "domhandler";
import { append, isTag, removeElement, replaceElement } from "domutils";
import { Element } from "react-native-render-html";

// Type definition to help with compatibility issues between Element types
export type DomElement = ChildNode & Element;

/**
 * Handles elements that should be immediately removed
 * @param element The element to check
 * @returns True if the element was handled
 */
export const handleRemovableElements = (element: DomElement): boolean => {
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
export const handleSpecialElements = (element: DomElement): boolean => {
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
 * @param width The maximum width for embedded content
 * @returns True if the element was handled
 */
export const handleEmbeddedContent = (
  element: DomElement,
  width: number,
): boolean => {
  // Handle YouTube embeds
  if (element.attribs?.class?.includes("__youtube_prefs__") ?? false) {
    if (element.tagName === "div") {
      const post = new Element("iframe", {
        src: element.attribs["data-facadesrc"],
      }) as unknown as ChildNode;
      replaceElement(element, post);
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
 * Handles container elements like figures and divs
 * @param element The element to process
 * @returns True if the element was handled
 */
export const handleContainerElements = (element: DomElement): boolean => {
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
      if (child instanceof Node && isTag(child)) {
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
        if (child instanceof Node && isTag(child)) {
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
export const handleImageElements = (element: DomElement): void => {
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
  element: DomElement,
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
export const makeElementRoot = (element: DomElement): void => {
  const parent = element.parent;
  if (!parent || !isTag(parent)) return;

  try {
    replaceElement(parent, element);
    makeElementRoot(element);
  } catch (error) {
    console.warn("Error replacing element:", error);
  }
};
