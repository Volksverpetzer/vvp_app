import type { TNode } from "@native-html/render";

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
 * The figure an image belongs to. The render engine may wrap the image in
 * anonymous nodes, so this looks a few ancestor levels up.
 */
const figureOf = (tnode?: TNode): TNode | undefined => {
  let node = tnode?.parent;
  for (let level = 0; level < 2 && node; level++, node = node.parent) {
    if (node.tagName === "figure") return node;
  }
  return undefined;
};

/** The node right before this one under the same parent. */
const previousSiblingOf = (tnode: TNode): TNode | undefined => {
  const siblings = tnode.parent?.children ?? [];
  return siblings[siblings.indexOf(tnode) - 1];
};

/** The node right after this one under the same parent. */
const nextSiblingOf = (tnode: TNode): TNode | undefined => {
  const siblings = tnode.parent?.children ?? [];
  const index = siblings.indexOf(tnode);
  return index === -1 ? undefined : siblings[index + 1];
};

/**
 * The figure a figcaption belongs to. The body's DOM visitor moves each
 * figcaption out of its figure to sit right after it (see
 * handleSpecialElements), so that's normally the caption's previous
 * sibling; a caption still inside its figure is handled too.
 */
export const figureOfCaption = (caption?: TNode): TNode | undefined => {
  if (!caption) return undefined;
  if (caption.parent?.tagName === "figure") return caption.parent;
  const previous = previousSiblingOf(caption);
  return previous?.tagName === "figure" ? previous : undefined;
};

/**
 * Whether the image's figure has a caption — i.e. the image's credit badge
 * is rendered on the caption row instead of over the image. Only the
 * image's own figure counts, not captions elsewhere in the article.
 */
export const hasFigcaptionSibling = (tnode?: TNode): boolean => {
  const figure = figureOf(tnode);
  if (!figure) return false;
  return (
    figure.children.some((child) => child.tagName === "figcaption") ||
    nextSiblingOf(figure)?.tagName === "figcaption"
  );
};
