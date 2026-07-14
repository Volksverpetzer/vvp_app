import type { TNode } from "react-native-render-html";

/**
 * Attachment id from the wp-image-{id} class WordPress puts on images in
 * post content; leads to the Image Source Control credit.
 */
export const mediaIdOf = (tnode?: TNode): string | undefined =>
  /wp-image-(\d+)/.exec(tnode?.attributes?.class ?? "")?.[1];

/**
 * Finds an img node among the descendants of a node. The render engine may
 * wrap children in anonymous nodes, so this looks a few levels deep.
 */
export const findImageTNode = (
  tnode?: TNode,
  depth: number = 2,
): TNode | undefined => {
  for (const child of tnode?.children ?? []) {
    if (child.tagName === "img") return child;
    if (depth > 1) {
      const found = findImageTNode(child, depth - 1);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Whether the node has a figcaption among its siblings — i.e. the image's
 * credit badge is rendered on the caption row instead of over the image.
 * The render engine may wrap the image in anonymous nodes, so this looks a
 * few ancestor levels up.
 */
export const hasFigcaptionSibling = (tnode?: TNode): boolean => {
  let node = tnode?.parent;
  for (let level = 0; level < 2 && node; level++, node = node.parent) {
    if (node.children.some((child) => child.tagName === "figcaption")) {
      return true;
    }
  }
  return false;
};
