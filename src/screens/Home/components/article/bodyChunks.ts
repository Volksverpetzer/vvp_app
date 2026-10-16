import type { ChildNode } from "domhandler";
import { Document, Element, isTag, isText } from "domhandler";
import { existsOne } from "domutils";
import { createContext } from "react";

/**
 * Top-level tags that render as their own block. A chunk boundary only ever
 * falls between two of these, so the render engine groups inline content
 * (hoisting, whitespace collapsing) the same as it would for the whole body.
 */
export const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "details",
  "div",
  "dl",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "iframe",
  // Images are hoisted out of <p>/<a> to the top level by
  // handleImageElements and render as their own block.
  "img",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
]);

/** Number of top-level elements in the first chunk, rendered right away. */
export const FIRST_CHUNK_SIZE = 12;
/** Number of top-level elements in each later chunk. */
export const CHUNK_SIZE = 40;

const findBody = (document: Document): Element | undefined => {
  for (const child of document.children) {
    if (!isTag(child)) continue;
    if (child.tagName === "body") return child;
    if (child.tagName === "html") {
      return child.children.find(
        (node): node is Element => isTag(node) && node.tagName === "body",
      );
    }
  }
  return undefined;
};

const wrapInDocument = (nodes: ChildNode[]): Document => {
  const body = new Element("body", {}, nodes);
  for (const node of nodes) node.parent = body;
  nodes[0].prev = null;
  nodes[nodes.length - 1].next = null;
  const document = new Document([body]);
  body.parent = document;
  return document;
};

/**
 * Splits a parsed article document (as returned by the render engine's
 * parseDocument, i.e. with the DOM visitors already applied) into documents
 * of consecutive top-level blocks, so the body can be rendered a few
 * blocks at a time instead of all at once. The input document is consumed.
 * A body that can't be split is returned as a single chunk.
 */
export const splitIntoChunks = (
  document: Document,
  firstChunkSize: number = FIRST_CHUNK_SIZE,
  chunkSize: number = CHUNK_SIZE,
): Document[] => {
  const body = findBody(document);
  if (!body) return [document];

  const chunks: ChildNode[][] = [];
  let current: ChildNode[] = [];
  let elements = 0;
  // Whether everything since the last element is whitespace and that
  // element was a block — i.e. a boundary here splits no inline run.
  let afterBlock = false;
  for (const node of body.children) {
    if (isTag(node)) {
      // A figcaption sits right after its figure (see handleSpecialElements)
      // and the credit lookup relies on that, so never split between them.
      const isCaption = node.tagName === "figcaption";
      const isBlock = isCaption || BLOCK_TAGS.has(node.tagName);
      const limit = chunks.length === 0 ? firstChunkSize : chunkSize;
      if (isBlock && !isCaption && afterBlock && elements >= limit) {
        chunks.push(current);
        current = [];
        elements = 0;
      }
      afterBlock = isBlock;
      elements++;
    } else if (isText(node) && node.data.trim() !== "") {
      afterBlock = false;
    }
    current.push(node);
  }
  if (current.length > 0) chunks.push(current);
  if (chunks.length <= 1) return [document];
  return chunks.map(wrapInDocument);
};

/** Index of the chunk containing the element with the given id, or -1. */
export const chunkIndexOfId = (chunks: Document[], id?: string): number =>
  id
    ? chunks.findIndex((chunk) =>
        existsOne((element) => element.attribs.id === id, chunk.children),
      )
    : -1;

/**
 * Returns how many top-level blocks precede the current body chunk, so a
 * top-level block's renderIndex can be reported as its index in the whole
 * article body (see BlockRenderer). A getter, because a chunk's preceding
 * block count is only known once the chunks before it have been built.
 */
export const BodyChunkOffsetContext = createContext<() => number>(() => 0);
